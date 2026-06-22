import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('GET /health', () => {
  it('200 + status ok döndürür', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBeDefined();
    expect(res.body.db).toBeDefined();
    expect(res.body.auth).toBeDefined();
  });
});

describe('Auth gerektiren endpointler', () => {
  it('/api/veri tokensız 401 döndürür', async () => {
    const res = await request(app).get('/api/veri');
    expect(res.status).toBe(401);
    expect(res.body.basarili).toBe(false);
    expect(res.body.hataKodu).toBe('AUTH_REQUIRED');
  });

  it('/api/auth/me tokensız 401 döndürür', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
