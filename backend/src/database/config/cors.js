'use strict';

const config = require('./index');

/** Allow any localhost port in development (Vite may use 5174 if 5173 is busy). */
function isLocalDevOrigin(origin) {
  if (config.env !== 'development') return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

module.exports = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) return callback(null, true);

    if (config.allowedOrigins.includes(origin) || isLocalDevOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy violation: ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Refresh-Token'],
  exposedHeaders: ['X-Request-ID', 'X-Total-Count', 'X-Total-Pages'],
  maxAge: 86400, // 24h preflight cache
};
