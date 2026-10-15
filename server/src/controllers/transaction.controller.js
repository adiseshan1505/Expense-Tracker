import { Transaction } from '../models/Transaction.js';
import { HttpError } from '../utils/HttpError.js';
import { escapeRegex, round2 } from '../utils/helpers.js';
import { currentMonth, listDays, listMonths, monthRange, shiftMonth } from '../utils/month.js';

const SORTS = {
  '-date': { date: -1, createdAt: -1 },
  date: { date: 1, createdAt: 1 },
  '-amount': { amount: -1, date: -1 },
  amount: { amount: 1, date: -1 },
};

const sumWhereType = (type) => ({ $sum: { $cond: [{ $eq: ['$type', type] }, '$amount', 0] } });

async function findOwned(req) {
  const transaction = await Transaction.findOne({ _id: req.valid.params.id, user: req.user._id });
  if (!transaction) throw new HttpError(404, 'Transaction not found');
  return transaction;
}

export async function listTransactions(req, res) {
  const { month, type, category, paymentMethod, q, sort, page, limit } = req.valid.query;

  const filter = { user: req.user._id };
  if (month) {
    const { start, end } = monthRange(month);
    filter.date = { $gte: start, $lt: end };
  }
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ note: pattern }, { category: pattern }];
  }

  const [transactions, total, [totals]] = await Promise.all([
    Transaction.find(filter)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter),
    Transaction.aggregate([
      { $match: filter },
      { $group: { _id: null, income: sumWhereType('income'), expense: sumWhereType('expense') } },
    ]),
  ]);

  const income = round2(totals?.income ?? 0);
  const expense = round2(totals?.expense ?? 0);

  res.json({
    transactions,
    totals: { income, expense, balance: round2(income - expense) },
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
}

export async function getTransaction(req, res) {
  res.json({ transaction: await findOwned(req) });
}

export async function createTransaction(req, res) {
  const transaction = await Transaction.create({ ...req.valid.body, user: req.user._id });
  res.status(201).json({ transaction });
}

export async function updateTransaction(req, res) {
  const transaction = await findOwned(req);
  transaction.set(req.valid.body);
  await transaction.save();
  res.json({ transaction });
}

export async function deleteTransaction(req, res) {
  const transaction = await findOwned(req);
  await transaction.deleteOne();
  res.status(204).end();
}

export async function getSummary(req, res) {
  const month = req.valid.query.month ?? currentMonth();
  const { months } = req.valid.query;
  const { start, end } = monthRange(month);
  const trendStart = monthRange(shiftMonth(month, -(months - 1))).start;
  const inMonth = { $match: { date: { $gte: start, $lt: end } } };

  const [facets] = await Transaction.aggregate([
    { $match: { user: req.user._id, date: { $gte: trendStart, $lt: end } } },
    {
      $facet: {
        totals: [
          inMonth,
          {
            $group: {
              _id: null,
              income: sumWhereType('income'),
              expense: sumWhereType('expense'),
              count: { $sum: 1 },
            },
          },
        ],
        byCategory: [
          inMonth,
          {
            $group: {
              _id: { type: '$type', category: '$category' },
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ],
        byPaymentMethod: [
          inMonth,
          { $match: { type: 'expense' } },
          { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ],
        daily: [
          inMonth,
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              income: sumWhereType('income'),
              expense: sumWhereType('expense'),
            },
          },
        ],
        trend: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
              income: sumWhereType('income'),
              expense: sumWhereType('expense'),
            },
          },
        ],
      },
    },
  ]);

  const totalsRow = facets.totals[0] ?? { income: 0, expense: 0, count: 0 };
  const income = round2(totalsRow.income);
  const expense = round2(totalsRow.expense);
  const balance = round2(income - expense);

  const byCategory = { income: [], expense: [] };
  for (const row of facets.byCategory) {
    const typeTotal = row._id.type === 'income' ? income : expense;
    byCategory[row._id.type].push({
      category: row._id.category,
      total: round2(row.total),
      count: row.count,
      percent: typeTotal ? round2((row.total / typeTotal) * 100) : 0,
    });
  }

  const dailyMap = new Map(facets.daily.map((d) => [d._id, d]));
  const trendMap = new Map(facets.trend.map((t) => [t._id, t]));

  res.json({
    month,
    totals: {
      income,
      expense,
      balance,
      count: totalsRow.count,
      savingsRate: income ? round2((balance / income) * 100) : 0,
    },
    byCategory,
    byPaymentMethod: facets.byPaymentMethod.map((row) => ({
      paymentMethod: row._id,
      total: round2(row.total),
      count: row.count,
    })),
    daily: listDays(month).map((date) => ({
      date,
      income: round2(dailyMap.get(date)?.income ?? 0),
      expense: round2(dailyMap.get(date)?.expense ?? 0),
    })),
    trend: listMonths(month, months).map((m) => {
      const row = trendMap.get(m);
      const mIncome = round2(row?.income ?? 0);
      const mExpense = round2(row?.expense ?? 0);
      return { month: m, income: mIncome, expense: mExpense, balance: round2(mIncome - mExpense) };
    }),
  });
}
