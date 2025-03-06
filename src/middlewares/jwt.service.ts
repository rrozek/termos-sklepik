import { JWT_EXPIRATION } from '@/config';
import jwt from 'jsonwebtoken';

export const generateJWT = async (
  payload: any,
  secretKey: string,
  expiresIn?: string,
) => {
  try {
    const token = jwt.sign(payload, secretKey, {
      expiresIn: expiresIn || JWT_EXPIRATION,
    });
    return `${token}`;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const verifyJWT = async (
  token: string,
  secretKey: string,
): Promise<jwt.JwtPayload> => {
  try {
    const cleanedToken = token.replace('Bearer ', '');
    const data = jwt.verify(cleanedToken, secretKey, {
      complete: false, // Ensure expiration is checked
    });

    if (typeof data === 'string') {
      throw new Error('Invalid token payload');
    }

    return data as jwt.JwtPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    throw new Error(error.message);
  }
};
