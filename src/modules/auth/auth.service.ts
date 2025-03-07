import { User, UserRole } from '@/interfaces';
import { validateSignIn, validateSignUp } from './auth.validator';
import authRepo from './auth.repo';
import { compareSync, hash } from 'bcrypt';
import { generateJWT, verifyJWT } from '@/middlewares/jwt.service';
import {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
  DJANGO_API_URL,
  DJANGO_JWT_SECRET,
  JWT_EXPIRATION,
  JWT_REFRESH_EXPIRATION,
} from '@/config';
import { CustomError } from '@/utils/custom-error';
import axios from 'axios';
import logger from '@/utils/logger';
import { sendSuccess } from '@/middlewares/response.middleware';
import kidRepo from '../kid/kid.repo';

export const signUpService = async (userData: User) => {
  const { error } = validateSignUp(userData);
  if (error) {
    throw new CustomError(error.details[0].message, 400);
  }

  const findUser = await authRepo.findUserByEmail(userData.email);
  if (findUser) {
    throw new CustomError(`Email ${userData.email} already exists`, 409);
  }

  const hashedPassword = await hash(userData.password, 10);
  const newUserData = await authRepo.createUser({
    ...userData,
    password: hashedPassword,
    role: userData.role || UserRole.PARENT,
    is_active: true,
  });

  return sendSuccess(newUserData, 'Successfully signed up', 201);
};

export const signInService = async (userData: User) => {
  const { error } = validateSignIn(userData);
  if (error) {
    throw new CustomError(error.details[0].message, 400);
  }

  // First try to authenticate with Django if DJANGO_API_URL is set
  let djangoUserId = null;
  let djangoTokenResponse = null;
  try {
    if (DJANGO_API_URL) {
      logger.info(
        `requesting token from Django API: ${DJANGO_API_URL}/token/ with data: ${JSON.stringify(userData)}`,
      );
      djangoTokenResponse = await axios.post(`${DJANGO_API_URL}/token/`, {
        email: userData.email,
        password: userData.password,
      });
      logger.info(
        `djangoTokenResponse: ${JSON.stringify(djangoTokenResponse.data)}`,
      );
      if (djangoTokenResponse.data && djangoTokenResponse.data.access) {
        // Decode Django token to get user_id
        const djangoPayload = await verifyJWT(
          djangoTokenResponse.data.access,
          DJANGO_JWT_SECRET as string,
        );

        djangoUserId = djangoPayload.user_id;
      }
    }
  } catch (error) {
    // If Django auth fails, we'll try our local auth
    logger.error(
      `Django auth error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    if (axios.isAxiosError(error) && error.response) {
      logger.error(
        `Django API response: ${JSON.stringify(error.response.data)}`,
      );
    }
    console.log('Django auth failed, trying local auth');
  }

  // Find user in our database
  let user = await authRepo.findUserByEmail(userData.email);

  if (djangoUserId) {
    // If Django auth succeeded but user doesn't exist in our DB, create them
    if (!user) {
      // Try to get user profile and kids from Django
      let djangoUserProfile = null;
      try {
        const profileResponse = await axios.get(`${DJANGO_API_URL}/users/me/`, {
          headers: {
            Authorization: `Bearer ${djangoTokenResponse!.data.access}`,
          },
        });
        djangoUserProfile = profileResponse.data;
        logger.info(
          `Django user profile: ${JSON.stringify(djangoUserProfile)}`,
        );
      } catch (profileError) {
        logger.error(
          `Failed to get Django user profile: ${profileError instanceof Error ? profileError.message : 'Unknown error'}`,
        );
      }

      // Create user with information from Django if available
      const userName =
        djangoUserProfile && djangoUserProfile.profile
          ? `${djangoUserProfile.profile.first_name} ${djangoUserProfile.profile.last_name}`.trim()
          : userData.email.split('@')[0];

      // Extract phone number if available
      const phone =
        djangoUserProfile &&
        djangoUserProfile.profile &&
        djangoUserProfile.profile.phone
          ? djangoUserProfile.profile.phone
          : undefined;

      user = await authRepo.createUser({
        email: userData.email,
        password: await hash(Math.random().toString(36), 10), // random password, not used
        name: userName,
        role: UserRole.PARENT,
        portal_user_id: djangoUserId,
        phone,
        is_active: true,
      });

      // If we got kids from Django, create them in our system
      if (
        djangoUserProfile &&
        djangoUserProfile.kids &&
        djangoUserProfile.kids.length > 0
      ) {
        try {
          for (const djangoKid of djangoUserProfile.kids) {
            // Only import active kids
            if (djangoKid.is_active) {
              // Create kid in our system using the kid repository
              await kidRepo.create({
                name: `${djangoKid.first_name} ${djangoKid.last_name}`.trim(),
                parent_id: user.id,
                rfid_token: [], // Empty by default, will be assigned later
                monthly_spending_limit: 0, // Default, parent will set this
                is_active: true,
              });

              logger.info(
                `Created kid from Django: ${djangoKid.first_name} ${djangoKid.last_name}`,
              );
            }
          }
        } catch (kidError) {
          logger.error(
            `Failed to create kids from Django: ${kidError instanceof Error ? kidError.message : 'Unknown error'}`,
          );
        }
      }
    }
    // If user exists but doesn't have Django ID, update it
    else if (!user.portal_user_id) {
      await authRepo.updateUser(user.id, { portal_user_id: djangoUserId });
      user.portal_user_id = djangoUserId;
    }
  }
  // If Django auth failed or not configured, check local credentials
  else {
    if (!user) {
      throw new CustomError('Email or password is invalid', 401);
    }

    const validPassword = compareSync(userData.password, user.password);
    if (!validPassword) {
      throw new CustomError('Email or password is invalid', 401);
    }
  }

  const payload = {
    userId: user.id,
    role: user.role,
    email: user.email,
  };

  const accessToken = await generateJWT(
    payload,
    JWT_ACCESS_TOKEN_SECRET as string,
    JWT_EXPIRATION as string,
  );
  const refreshToken = await generateJWT(
    payload,
    JWT_REFRESH_TOKEN_SECRET as string,
    JWT_REFRESH_EXPIRATION as string,
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_active: user.is_active,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshTokenService = async (refreshToken: string) => {
  try {
    // Verify refresh token
    const payload = await verifyJWT(
      refreshToken,
      JWT_REFRESH_TOKEN_SECRET as string,
    );

    // Check if user exists and is active
    const userId = payload.userId;
    const user = await authRepo.findUserById(userId);

    if (!user || !user.is_active) {
      throw new CustomError('Invalid refresh token', 401);
    }

    // Generate new tokens
    const newPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    const accessToken = await generateJWT(
      newPayload,
      JWT_ACCESS_TOKEN_SECRET as string,
    );
    const newRefreshToken = await generateJWT(
      newPayload,
      JWT_REFRESH_TOKEN_SECRET as string,
    );

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    logger.error(
      `Refresh token error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    throw new CustomError('Invalid refresh token', 401);
  }
};

export const verifyDjangoTokenService = async (token: string) => {
  try {
    // Verify the Django token
    const payload = await verifyJWT(token, DJANGO_JWT_SECRET as string);

    // Check if user exists in our system
    let user = await authRepo.findUserByPortalUserId(payload.user_id);

    // If not, fetch user details from Django API and create in our system
    if (!user) {
      try {
        // Make API call to Django to get user details
        const response = await axios.get(`${DJANGO_API_URL}/users/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const djangoUser = response.data;
        logger.info(`Django user data: ${JSON.stringify(djangoUser)}`);

        // Extract user name from profile if available
        const userName = djangoUser.profile
          ? `${djangoUser.profile.first_name} ${djangoUser.profile.last_name}`.trim()
          : djangoUser.email.split('@')[0];

        // Extract phone number if available
        const phone =
          djangoUser.profile && djangoUser.profile.phone
            ? djangoUser.profile.phone
            : undefined;

        // Create user in our system
        user = await authRepo.createUser({
          email: djangoUser.email,
          password: await hash(Math.random().toString(36), 10), // random password
          name: userName,
          role: UserRole.PARENT,
          portal_user_id: payload.user_id,
          phone,
          is_active: true,
        });

        // If we got kids from Django, create them in our system
        if (djangoUser.kids && djangoUser.kids.length > 0) {
          try {
            for (const djangoKid of djangoUser.kids) {
              // Only import active kids
              if (djangoKid.is_active) {
                // Create kid in our system using the kid repository
                await kidRepo.create({
                  name: `${djangoKid.first_name} ${djangoKid.last_name}`.trim(),
                  parent_id: user.id,
                  rfid_token: [], // Empty by default, will be assigned later
                  monthly_spending_limit: 0, // Default, parent will set this
                  is_active: true,
                });

                logger.info(
                  `Created kid from Django: ${djangoKid.first_name} ${djangoKid.last_name}`,
                );
              }
            }
          } catch (kidError) {
            logger.error(
              `Failed to create kids from Django: ${kidError instanceof Error ? kidError.message : 'Unknown error'}`,
            );
          }
        }
      } catch (error) {
        logger.error(
          `Error fetching user details from Django API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        throw new CustomError(
          'Failed to fetch user details from Django API',
          500,
        );
      }
    }

    // Generate our tokens
    const newPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    const accessToken = await generateJWT(
      newPayload,
      JWT_ACCESS_TOKEN_SECRET as string,
    );
    const refreshToken = await generateJWT(
      newPayload,
      JWT_REFRESH_TOKEN_SECRET as string,
    );

    const response = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
      },
      accessToken,
      refreshToken,
    };
    return sendSuccess(response, 'Successfully signed in', 200);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error(
      `Error verifying Django token: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    throw new CustomError('Invalid token', 401);
  }
};
