import { connectDB, disconnectDB } from '../config/db.js';
import { Transaction } from '../models/Transaction.js';
import { round2 } from '../utils/helpers.js';
import { currentMonth, listDays, listMonths } from '../utils/month.js';

// Deterministic PRNG so every seed run produces the same dataset.
let state = 42;
const random = () => {
  state = (state * 1664525 + 1013904223) % 2 ** 32;
  return state / 2 ** 32;
};
const pick = (items) => items[Math.floor(random() * items.length)];
const between = (min, max) => round2(min + random() * (max - min));

const EXPENSE_TEMPLATES = [
  { category: 'Canteen & Snacks', min: 20, max: 180, perMonth: 14, methods: ['upi', 'cash', 'campus_card'], notes: ['Samosa & chai', 'Lunch at canteen', 'Cold coffee', 'Maggi after class', 'Juice'] },
  { category: 'Printouts & Xerox', min: 10, max: 120, perMonth: 4, methods: ['cash', 'upi'], notes: ['Lab record printout', 'Notes xerox', 'Assignment printout'] },
  { category: 'Stationery', min: 30, max: 350, perMonth: 2, methods: ['cash', 'upi'], notes: ['Pens & notebook', 'Graph sheets', 'Drawing kit', 'Calculator battery'] },
  { category: 'Transport', min: 20, max: 150, perMonth: 6, methods: ['upi', 'cash'], notes: ['Auto to college', 'Bus ticket', 'Metro recharge', 'Bike fuel'] },
  { category: 'Mobile & Internet', min: 199, max: 349, perMonth: 1, methods: ['upi'], notes: ['Monthly recharge', 'Data booster'] },
  { category: 'Outings & Fun', min: 150, max: 700, perMonth: 2, methods: ['upi', 'debit_card'], notes: ['Movie with friends', 'Birthday treat', 'Weekend cafe'] },
  { category: 'Laundry & Essentials', min: 60, max: 400, perMonth: 2, methods: ['cash', 'upi'], notes: ['Laundry', 'Toiletries', 'Detergent & soap'] },
];

const OCCASIONAL = [
  { category: 'Books & Notes', min: 150, max: 900, chance: 0.6, methods: ['upi', 'cash'], notes: ['Reference book', 'Second-hand textbook', 'Lab manual'] },
  { category: 'Clubs & Events', min: 100, max: 500, chance: 0.5, methods: ['upi'], notes: ['Tech fest registration', 'Sports club fee', 'Cultural night pass'] },
  { category: 'Coaching & Tuition', min: 800, max: 1500, chance: 0.35, methods: ['upi', 'bank_transfer'], notes: ['GATE prep class', 'Spoken English class'] },
  { category: 'Fees & Exams', min: 300, max: 1500, chance: 0.25, methods: ['bank_transfer', 'upi'], notes: ['Semester exam fee', 'Revaluation fee', 'Library fine'] },
  { category: 'Medical', min: 50, max: 400, chance: 0.3, methods: ['cash', 'upi'], notes: ['Pharmacy', 'Cold & fever tablets'] },
];

function buildMonth(month, today) {
  const days = listDays(month).filter((d) => d <= today);
  if (!days.length) return [];

  const at = (day) => new Date(`${day}T00:00:00.000Z`);
  const rows = [
    { type: 'income', category: 'From Parents', amount: 8000, date: at(days[0]), paymentMethod: 'bank_transfer', note: 'Monthly pocket money' },
    { type: 'expense', category: 'Hostel & Mess', amount: 3500, date: at(days[Math.min(2, days.length - 1)]), paymentMethod: 'bank_transfer', note: 'Mess bill' },
  ];

  if (random() > 0.5) {
    rows.push({ type: 'income', category: 'Part-time Job', amount: between(800, 2500), date: at(pick(days)), paymentMethod: 'upi', note: 'Weekend tutoring' });
  }
  if (random() > 0.8) {
    rows.push({ type: 'income', category: 'Scholarship', amount: 5000, date: at(pick(days)), paymentMethod: 'bank_transfer', note: 'Merit scholarship' });
  }

  const expense = (t) => ({
    type: 'expense',
    category: t.category,
    amount: Math.round(between(t.min, t.max)),
    date: at(pick(days)),
    paymentMethod: pick(t.methods),
    note: pick(t.notes),
  });

  for (const t of EXPENSE_TEMPLATES) {
    const count = Math.max(1, Math.round(t.perMonth * (0.6 + random() * 0.8) * (days.length / 30)));
    for (let i = 0; i < count; i += 1) rows.push(expense(t));
  }
  for (const t of OCCASIONAL) {
    if (random() < t.chance) rows.push(expense(t));
  }

  return rows;
}

async function seed() {
  await connectDB();

  const today = new Date().toISOString().slice(0, 10);
  const docs = listMonths(currentMonth(), 6).flatMap((month) => buildMonth(month, today));
  const { deletedCount } = await Transaction.deleteMany({});
  await Transaction.insertMany(docs);

  console.log(`Removed ${deletedCount} existing transactions and seeded ${docs.length} sample transactions`);
}

try {
  await seed();
} catch (err) {
  console.error('Seeding failed:', err);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
