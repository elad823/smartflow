import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend folder if exists
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface Config {
  port: number;
  host: string;
  corsOrigin: string | boolean | string[];
  geminiApiKey: string | undefined;
  geminiModel: string;
}

export const config: Config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
};
