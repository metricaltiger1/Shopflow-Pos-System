
import { config } from 'dotenv';

config();

export const env = {
  PORT: parseInt(process.env.PORT || '3001'),
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./data/app.sqlite',
  NODE_ENV: process.env.NODE_ENV || 'development',
};
