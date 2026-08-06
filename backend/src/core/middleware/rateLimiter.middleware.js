'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../../database/config');
const { MESSAGES } = require('../../shared/constants/messages');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants/httpStatus');

const handler = (req, res) => {
  res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(
    ApiResponse.error(MESSAGES.RATE_LIMIT_EXCEEDED),
  );
};

/** Local preview / failed login retries trip production caps quickly. */
const skipInNonProduction = () => config.env !== 'production';

/**
 * Global rate limiter — applied to all routes.
 */
const globalRateLimiter = rateLimit({
  windowMs: config.rateLimiter.windowMs,
  max: config.rateLimiter.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: skipInNonProduction,
});

/**
 * Strict rate limiter for authentication endpoints.
 * 10 attempts per 15 minutes in production.
 */
const authRateLimiter = rateLimit({
  windowMs: config.rateLimiter.windowMs,
  max: config.rateLimiter.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skipSuccessfulRequests: true, // Only count failed attempts
  skip: skipInNonProduction,
});

/**
 * API key-based rate limiter (per user).
 * Apply after authentication.
 */
const userRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: skipInNonProduction,
});

module.exports = { globalRateLimiter, authRateLimiter, userRateLimiter };
