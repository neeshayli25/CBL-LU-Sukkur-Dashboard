'use strict';

const IORedis = require('ioredis');
const redisConfig = require('../../database/config/redis');
const logger = require('../../shared/utils/logger');

let client;
let redisDisabled = false;

const getClient = () => {
  if (redisDisabled) return null;
  if (!client) {
    try {
      client = new IORedis({
        ...redisConfig,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
      });
      client.on('connect', () => logger.info('✅ Redis connected'));
      client.on('error', (err) => {
        logger.warn(`Redis unavailable (continuing without cache): ${err.message}`);
        redisDisabled = true;
      });
    } catch (err) {
      logger.warn(`Redis init failed (continuing without cache): ${err.message}`);
      redisDisabled = true;
      return null;
    }
  }
  return client;
};

class CacheService {
  async get(key) {
    try {
      const c = getClient();
      if (!c) return null;
      if (c.status !== 'ready') {
        await c.connect().catch(() => {
          redisDisabled = true;
        });
      }
      if (redisDisabled) return null;
      const value = await c.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      redisDisabled = true;
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      const c = getClient();
      if (!c || redisDisabled) return;
      await c.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      redisDisabled = true;
    }
  }

  async del(key) {
    try {
      const c = getClient();
      if (!c || redisDisabled) return;
      await c.del(key);
    } catch {
      redisDisabled = true;
    }
  }

  async delPattern(pattern) {
    try {
      const c = getClient();
      if (!c || redisDisabled) return;
      const keys = await c.keys(pattern);
      if (keys.length > 0) await c.del(keys);
    } catch {
      redisDisabled = true;
    }
  }

  async remember(key, ttl, fn) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }
}

module.exports = new CacheService();
