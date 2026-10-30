import dotenv from 'dotenv';
import {randomBytes} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeMongoUri} from './mongoUri.js';

const configDirectory = dirname(fileURLToPath(import.meta.url));
dotenv.config({path: resolve(configDirectory, '..', '.env')});
dotenv.config({path: resolve(configDirectory, '..', '..', '..', '.env')});

const isProduction = process.env.NODE_ENV === 'production';
const providedSecret = process.env.JWT_SECRET?.trim();

if (isProduction && !providedSecret) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production.');
}

const rawPort = Number(process.env.PORT || 3000);
if (!Number.isInteger(rawPort) || rawPort < 1 || rawPort > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

export const config = {
  port: rawPort,
  mongoUri: normalizeMongoUri(
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fictionflix_auth',
  ),
  jwtSecret: providedSecret || randomBytes(64).toString('hex'),
  isProduction,
  cookieName: 'fictionflix_auth',
  sessionDurationMs: 8 * 60 * 60 * 1000,
};

if (!providedSecret && !isProduction) {
  console.warn('Using a temporary development JWT secret; sessions expire when the server restarts.');
}