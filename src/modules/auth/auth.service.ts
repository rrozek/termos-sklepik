import { User, UserRole } from '@/interfaces';
import { validateSignIn, validateSignUp } from './auth.validator';
import repo from './auth.repo';
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
import { log } from 'console';
import logger from '@/utils/logger';

export const signUpService = async (userData: User) => {
  const { error } = validateSignUp(userData);
  if (error) {
    throw new CustomError(error.details[0].message, 400);
  }

  const findUser = await repo.findUserByEmail(userData.email);
  if (findUser) {
    throw new CustomError(`Email ${userData.email} already exists`, 409);
  }

  const hashedPassword = await hash(userData.password, 10);
  const newUserData = await repo.createUser({
    ...userData,
    password: hashedPassword,
    role: userData.role || UserRole.PARENT,
    is_active: true,
  });

  return { user: newUserData };
};

export const signInService = async (userData: User) => {
  const { error } = validateSignIn(userData);
  if (error) {
    throw new CustomError(error.details[0].message, 400);
  }

  // First try to authenticate with Django if DJANGO_API_URL is set
  let djangoUserId = null;

  try {
    if (DJANGO_API_URL) {
        logger.info(`requesting token from Django API: ${DJANGO_API_URL}/token/ with data: ${JSON.stringify(userData)}`);
      const djangoResponse = await axios.post(`${DJANGO_API_URL}/token/`, {
        email: userData.email,
        password: userData.password,
      });
      logger.info(`djangoResponse: ${JSON.stringify(djangoResponse.data)}`);
      if (djangoResponse.data && djangoResponse.data.access) {
        // Decode Django token to get user_id
        const djangoPayload = await verifyJWT(
          djangoResponse.data.access,
          DJANGO_JWT_SECRET as string,
        );

        djangoUserId = djangoPayload.user_id;
      }
    }
  } catch (error) {
    // If Django auth fails, we'll try our local auth
  logger.error(`Django auth error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  if (axios.isAxiosError(error) && error.response) {
    logger.error(`Django API response: ${JSON.stringify(error.response.data)}`);
  }
  console.log('Django auth failed, trying local auth');
  }

  // Find user in our database
  let user = await repo.findUserByEmail(userData.email);

  if (djangoUserId) {
    // If Django auth succeeded but user doesn't exist in our DB, create them
    if (!user) {
      user = await repo.createUser({
        email: userData.email,
        password: await hash(Math.random().toString(36), 10), // random password, not used
        name: userData.email.split('@')[0], // Default name from email
        role: UserRole.PARENT,
        portal_user_id: djangoUserId,
        is_active: true,
      });
    }
    // If user exists but doesn't have Django ID, update it
    else if (!user.portal_user_id) {
      await repo.updateUser(user.id, { portal_user_id: djangoUserId });
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
    const user = await repo.findUserById(userId);

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
    throw new CustomError('Invalid refresh token', 401);
  }
};

export const verifyDjangoTokenService = async (token: string) => {
  try {
    // Verify the Django token
    const payload = await verifyJWT(token, DJANGO_JWT_SECRET as string);

    // Check if user exists in our system
    let user = await repo.findUserByPortalUserId(payload.user_id);

    // If not, fetch user details from Django API and create in our system
    if (!user) {
      try {
        // Make API call to Django to get user details
        const response = await axios.get(`${DJANGO_API_URL}/users/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const djangoUser = response.data;

        // Create user in our system
        user = await repo.createUser({
          email: djangoUser.email,
          password: await hash(Math.random().toString(36), 10), // random password
          name: djangoUser.name || djangoUser.email.split('@')[0],
          role: UserRole.PARENT,
          portal_user_id: payload.user_id,
          is_active: true,
        });
      } catch (error) {
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
  } catch (error) {
    throw new CustomError('Invalid Django token', 401);
  }
};
