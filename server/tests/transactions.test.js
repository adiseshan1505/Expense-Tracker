import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { clearDatabase, sampleTransaction, startTestApp, stopTestApp } from './helpers.js';

let app;

before(async () => {
  app = await startTestApp();
});
after(stopTestApp);
beforeEach(clearDatabase);

const create = (overrides) => request(app).post('/api/transactions').send(sampleTransaction(overrides));

describe('POST /api/transactions', () => {
  it('creates a transaction', async () => {
    const res = await create().expect(201);
    const { transaction } = res.body;
    assert.equal(transaction.amount, 250.5);
    assert.equal(transaction.category, 'Canteen & Snacks');
    assert.equal(transaction.date, '2026-10-05T00:00:00.000Z');
    assert.ok(transaction.id);
  });

  it('defaults note to an empty string', async () => {
    const { note, ...body } = sampleTransaction();
    const res = await request(app).post('/api/transactions').send(body).expect(201);
    assert.equal(res.body.transaction.note, '');
  });

  it('validates every field', async () => {
    const res = await request(app)
      .post('/api/transactions')
      
      .send({ amount: -5, type: 'gift', date: '2026-02-30', paymentMethod: 'barter', note: 'x'.repeat(201) })
      .expect(400);

    const fields = new Set(res.body.details.map((d) => d.field));
    for (const field of ['amount', 'type', 'category', 'date', 'paymentMethod', 'note']) {
      assert.ok(fields.has(field), `expected an error for ${field}`);
    }
  });

  it('rejects a category that does not match the type', async () => {
    const res = await create({ type: 'income', category: 'Canteen & Snacks' }).expect(400);
    assert.equal(res.body.details[0].field, 'category');
  });

  it('rejects amounts with more than two decimals', async () => {
    await create({ amount: 10.123 }).expect(400);
  });
});

describe('GET /api/transactions', () => {
  beforeEach(async () => {
    await create({ date: '2026-09-30', amount: 100 });
    await create({ date: '2026-10-01', amount: 200 });
    await create({ date: '2026-10-31', amount: 300, category: 'Transport', paymentMethod: 'cash' });
    await create({ date: '2026-10-15', amount: 5000, type: 'income', category: 'From Parents', note: 'October pay' });
    await create({ date: '2026-11-01', amount: 400 });
  });

  it('filters by month using inclusive start and exclusive end', async () => {
    const res = await request(app).get('/api/transactions?month=2026-10').expect(200);
    assert.equal(res.body.transactions.length, 3);
    assert.deepEqual(res.body.totals, { income: 5000, expense: 500, balance: 4500 });
    assert.deepEqual(
      res.body.transactions.map((t) => t.date.slice(0, 10)),
      ['2026-10-31', '2026-10-15', '2026-10-01'],
    );
  });

  it('filters by type, category, payment method and search text', async () => {
    const byType = await request(app).get('/api/transactions?month=2026-10&type=income');
    assert.equal(byType.body.transactions.length, 1);

    const byCategory = await request(app).get('/api/transactions?category=Transport');
    assert.equal(byCategory.body.transactions.length, 1);

    const byMethod = await request(app).get('/api/transactions?paymentMethod=cash');
    assert.equal(byMethod.body.transactions.length, 1);

    const bySearch = await request(app).get('/api/transactions?q=october');
    assert.equal(bySearch.body.transactions[0].category, 'From Parents');
  });

  it('ignores empty query parameters', async () => {
    const res = await request(app).get('/api/transactions?month=2026-10&type=&category=').expect(200);
    assert.equal(res.body.transactions.length, 3);
  });

  it('paginates and sorts', async () => {
    const res = await request(app).get('/api/transactions?limit=2&page=2&sort=amount').expect(200);
    assert.deepEqual(res.body.pagination, { page: 2, limit: 2, total: 5, pages: 3 });
    assert.deepEqual(res.body.transactions.map((t) => t.amount), [300, 400]);
  });

  it('rejects an invalid month', async () => {
    const res = await request(app).get('/api/transactions?month=2026-13').expect(400);
    assert.equal(res.body.details[0].field, 'month');
  });
});

describe('PUT and DELETE /api/transactions/:id', () => {
  it('updates a transaction', async () => {
    const { body } = await create();
    const res = await request(app)
      .put(`/api/transactions/${body.transaction.id}`)
      
      .send(sampleTransaction({ amount: 99, type: 'income', category: 'Scholarship', note: 'Merit award' }))
      .expect(200);
    assert.equal(res.body.transaction.amount, 99);
    assert.equal(res.body.transaction.type, 'income');
    assert.equal(res.body.transaction.note, 'Merit award');
  });

  it('validates the update payload', async () => {
    const { body } = await create();
    await request(app)
      .put(`/api/transactions/${body.transaction.id}`)
      
      .send({ amount: 0 })
      .expect(400);
  });

  it('deletes a transaction', async () => {
    const { body } = await create();
    await request(app).delete(`/api/transactions/${body.transaction.id}`).expect(204);
    await request(app).get(`/api/transactions/${body.transaction.id}`).expect(404);
  });

  it('rejects malformed ids', async () => {
    const res = await request(app).delete('/api/transactions/not-an-id').expect(400);
    assert.equal(res.body.details[0].message, 'Invalid transaction id');
  });
});

describe('GET /api/transactions/summary', () => {
  beforeEach(async () => {
    await create({ date: '2026-10-01', amount: 50000, type: 'income', category: 'From Parents', paymentMethod: 'bank_transfer' });
    await create({ date: '2026-10-03', amount: 1000.1, category: 'Canteen & Snacks', paymentMethod: 'upi' });
    await create({ date: '2026-10-03', amount: 3000.2, category: 'Stationery', paymentMethod: 'campus_card' });
    await create({ date: '2026-10-20', amount: 6000, category: 'Canteen & Snacks', paymentMethod: 'upi' });
    await create({ date: '2026-08-10', amount: 40000, type: 'income', category: 'From Parents' });
    await create({ date: '2026-08-12', amount: 500, category: 'Transport' });
    await create({ date: '2026-11-02', amount: 999, category: 'Transport' });
  });

  it('aggregates totals for the requested month', async () => {
    const res = await request(app).get('/api/transactions/summary?month=2026-10').expect(200);
    assert.equal(res.body.month, '2026-10');
    assert.deepEqual(res.body.totals, {
      income: 50000,
      expense: 10000.3,
      balance: 39999.7,
      count: 4,
      savingsRate: 80,
    });
  });

  it('breaks down spending by category and payment method', async () => {
    const res = await request(app).get('/api/transactions/summary?month=2026-10');
    assert.deepEqual(res.body.byCategory.expense.map((c) => [c.category, c.total, c.count]), [
      ['Canteen & Snacks', 7000.1, 2],
      ['Stationery', 3000.2, 1],
    ]);
    assert.equal(res.body.byCategory.income[0].percent, 100);
    assert.deepEqual(res.body.byPaymentMethod.map((m) => m.paymentMethod), ['upi', 'campus_card']);
  });

  it('returns a zero-filled daily series and a monthly trend', async () => {
    const res = await request(app).get('/api/transactions/summary?month=2026-10&months=3');
    assert.equal(res.body.daily.length, 31);
    assert.deepEqual(res.body.daily[2], { date: '2026-10-03', income: 0, expense: 4000.3 });
    assert.deepEqual(res.body.daily[1], { date: '2026-10-02', income: 0, expense: 0 });
    assert.deepEqual(res.body.trend, [
      { month: '2026-08', income: 40000, expense: 500, balance: 39500 },
      { month: '2026-09', income: 0, expense: 0, balance: 0 },
      { month: '2026-10', income: 50000, expense: 10000.3, balance: 39999.7 },
    ]);
  });

  it('returns zeros for an empty month', async () => {
    const res = await request(app).get('/api/transactions/summary?month=2025-02').expect(200);
    assert.equal(res.body.totals.count, 0);
    assert.equal(res.body.daily.length, 28);
    assert.deepEqual(res.body.byCategory, { income: [], expense: [] });
  });
});

describe('GET /api/meta', () => {
  it('returns categories, payment methods and the fixed currency', async () => {
    const res = await request(app).get('/api/meta').expect(200);
    assert.equal(res.body.currency, 'INR');
    assert.ok(res.body.categories.expense.includes('Canteen & Snacks'));
    assert.ok(res.body.paymentMethods.some((m) => m.value === 'upi'));
  });

  it('has no authentication routes', async () => {
    await request(app).post('/api/auth/login').send({}).expect(404);
  });
});
