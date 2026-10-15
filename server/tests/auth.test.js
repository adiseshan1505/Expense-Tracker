import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { clearDatabase, createUser, startTestApp, stopTestApp } from './helpers.js';

let app;

before(async () => {
  app = await startTestApp();
});
after(stopTestApp);
beforeEach(clearDatabase);

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token without the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Asha', email: 'Asha@Example.com', password: 'secret123' })
      .expect(201);

    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'asha@example.com');
    assert.equal(res.body.user.currency, 'INR');
    assert.equal(res.body.user.password, undefined);
    assert.ok(res.body.user.id);
  });

  it('rejects a duplicate email', async () => {
    const { credentials } = await createUser(app);
    const res = await request(app).post('/api/auth/register').send(credentials).expect(409);
    assert.match(res.body.message, /already exists/);
  });

  it('returns field-level validation errors', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: 'short' })
      .expect(400);

    const fields = res.body.details.map((d) => d.field);
    assert.ok(fields.includes('name'));
    assert.ok(fields.includes('email'));
    assert.ok(fields.includes('password'));
  });

  it('rejects malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"name":')
      .expect(400);
    assert.match(res.body.message, /not valid JSON/);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const { credentials } = await createUser(app);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, credentials.email);
  });

  it('rejects a wrong password with a generic message', async () => {
    const { credentials } = await createUser(app);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrong-pass1' })
      .expect(401);
    assert.equal(res.body.message, 'Invalid email or password');
  });

  it('rejects an unknown email with the same message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever1' })
      .expect(401);
    assert.equal(res.body.message, 'Invalid email or password');
  });
});

describe('Session handling', () => {
  it('requires a bearer token for /me', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage').expect(401);
  });

  it('returns the current user for a valid token', async () => {
    const { token, user } = await createUser(app);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    assert.equal(res.body.user.id, user.id);
  });

  it('revokes the token on logout', async () => {
    const { token } = await createUser(app);
    const auth = { Authorization: `Bearer ${token}` };

    await request(app).post('/api/auth/logout').set(auth).expect(204);
    await request(app).get('/api/auth/me').set(auth).expect(401);
    await request(app).get('/api/transactions').set(auth).expect(401);
  });

  it('keeps other sessions alive after logging out one of them', async () => {
    const { token, credentials } = await createUser(app);
    const second = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`).expect(204);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${second.body.token}`).expect(200);
  });
});

describe('Profile management', () => {
  it('updates name and currency', async () => {
    const { token } = await createUser(app);
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed', currency: 'USD' })
      .expect(200);
    assert.equal(res.body.user.name, 'Renamed');
    assert.equal(res.body.user.currency, 'USD');
  });

  it('changes the password and invalidates older tokens', async () => {
    const { token, credentials } = await createUser(app);

    await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'incorrect1', newPassword: 'NewPassw0rd' })
      .expect(400);

    // iat has one-second resolution, so wait for the clock to tick past the old token.
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: credentials.password, newPassword: 'NewPassw0rd' })
      .expect(200);

    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`).expect(200);
    await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'NewPassw0rd' })
      .expect(200);
  });

  it('deletes the account and its transactions', async () => {
    const { token, credentials } = await createUser(app);
    const auth = { Authorization: `Bearer ${token}` };

    await request(app).delete('/api/auth/me').set(auth).send({ password: 'wrong' }).expect(400);
    await request(app).delete('/api/auth/me').set(auth).send({ password: credentials.password }).expect(204);
    await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(401);
  });
});
