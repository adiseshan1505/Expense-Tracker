import mongoose from 'mongoose';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

let memoryServer;

export async function startTestApp() {
  let uri = process.env.MONGO_URI_TEST;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  await mongoose.connect(uri);
  const { app } = await import('../src/app.js');
  return app;
}

export async function stopTestApp() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await memoryServer?.stop();
}

export async function clearDatabase() {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

let userCounter = 0;

export async function createUser(app, overrides = {}) {
  userCounter += 1;
  const credentials = {
    name: 'Test User',
    email: `user${userCounter}@example.com`,
    password: 'Passw0rd!',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(credentials).expect(201);
  return { ...res.body, credentials };
}

export const sampleTransaction = (overrides = {}) => ({
  amount: 250.5,
  type: 'expense',
  category: 'Canteen & Snacks',
  date: '2026-10-05',
  paymentMethod: 'upi',
  note: 'Lunch at canteen',
  ...overrides,
});
