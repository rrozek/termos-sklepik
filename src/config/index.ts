import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// Determine environment
export const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = `.env.${NODE_ENV}`;

// Load environment variables
config({ path: envFile });

// Check if environment file exists
const envFilePath = path.resolve(process.cwd(), envFile);
if (!fs.existsSync(envFilePath)) {
  console.warn(`Warning: Environment file '${envFile}' not found.`);
}

// General configuration
export const PORT = process.env.PORT || '3000';
export const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// JWT configuration
export const JWT_ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_TOKEN_SECRET || 'access_token_secret';
export const JWT_REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_TOKEN_SECRET || 'refresh_token_secret';
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d';
export const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
// Database configuration
export const DB_PORT = process.env.DB_PORT || '5432';
export const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
export const DB_PASSWORD = process.env.DB_PASSWORD || '';
export const DB_NAME = process.env.DB_NAME || 'sklepik_db';
export const DB_HOST = process.env.DB_HOST || 'localhost';
export const DB_DIALECT = process.env.DB_DIALECT || 'postgres';

// Django integration
export const DJANGO_API_URL = process.env.DJANGO_API_URL || '';
export const DJANGO_JWT_SECRET = process.env.DJANGO_JWT_SECRET || '';

// Logging
export const LOG_LEVEL =
  process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
export const LOG_FILE_ENABLED = process.env.LOG_FILE_ENABLED === 'true';

// File upload
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
export const MAX_FILE_SIZE = parseInt(
  process.env.MAX_FILE_SIZE || '5242880',
  10,
); // 5MB default

// CORS configuration
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Validate required configuration
const requiredConfig = [
  'JWT_ACCESS_TOKEN_SECRET',
  'JWT_REFRESH_TOKEN_SECRET',
  'DB_PASSWORD',
];

const missingConfig = requiredConfig.filter(key => !process.env[key]);
if (missingConfig.length > 0) {
  console.warn(
    `Warning: Missing required environment variables: ${missingConfig.join(', ')}`,
  );
}
