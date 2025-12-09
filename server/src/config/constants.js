export const PORT = process.env.PORT || 3001;
export const HOST = process.env.HOST || 'localhost';
export const API_PREFIX = process.env.API_PREFIX || '/api';

export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 52428800; // 50MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15分
export const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
