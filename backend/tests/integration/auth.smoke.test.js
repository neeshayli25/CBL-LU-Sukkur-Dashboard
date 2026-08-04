'use strict';

/**
 * Smoke / integration check for the auth happy path.
 * Requires a running MySQL with migrated + seeded cbl_db.
 *
 * Run: cd backend && npm run test:integration -- --testPathPattern=auth.smoke
 */

const request = require('supertest');

// Skip cleanly when DB/env is not configured for CI without MySQL
const hasDb = Boolean(process.env.DB_HOST && process.env.JWT_ACCESS_SECRET);

describe('Auth smoke', () => {
  let app;

  beforeAll(() => {
    if (!hasDb) return;
    // eslint-disable-next-line global-require
    require('dotenv').config();
    // eslint-disable-next-line global-require
    app = require('../../src/app');
  });

  const maybe = hasDb ? it : it.skip;

  maybe('POST /api/v1/auth/login returns tokens for seeded superadmin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@cblapp.com', password: 'Admin@123!' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeTruthy();
    expect(res.body.data.tokens.refreshToken).toBeTruthy();
    expect(res.body.data.user.email).toBe('superadmin@cblapp.com');
    expect(Array.isArray(res.body.data.user.roles)).toBe(true);
    expect(Array.isArray(res.body.data.user.permissions)).toBe(true);
  });

  maybe('POST /api/v1/auth/verify-email issues SSO contract payload', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: 'superadmin@cblapp.com' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.authorized).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeTruthy();
    expect(res.body.data.user.roles).toContain('super_admin');
  });

  maybe('GET /api/v1/auth/me accepts Bearer access token', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'superadmin@cblapp.com', password: 'Admin@123!' });

    const token = login.body.data.tokens.accessToken;
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.email).toBe('superadmin@cblapp.com');
  });
});
