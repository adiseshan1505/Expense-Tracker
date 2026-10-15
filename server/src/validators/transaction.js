import { z } from 'zod';
import {
  CATEGORIES,
  NOTE_MAX_LENGTH,
  PAYMENT_METHOD_VALUES,
  TRANSACTION_TYPES,
} from '../constants/index.js';
import { round2 } from '../utils/helpers.js';

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format');

const type = z.enum(TRANSACTION_TYPES, { error: 'Type must be "income" (pocket money) or "expense"' });

const paymentMethod = z.enum(PAYMENT_METHOD_VALUES, { error: 'Select a valid payment method' });

const amount = z.coerce
  .number({ error: 'Amount must be a number' })
  .positive('Amount must be greater than 0')
  .max(1_000_000_000, 'Amount is too large')
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'Amount can have at most 2 decimal places')
  .transform(round2);

const date = z
  .string({ error: 'Date is required' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .transform((value, ctx) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    const year = parsed.getUTCFullYear();
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
      ctx.addIssue({ code: 'custom', message: 'Date is not a valid calendar date' });
      return z.NEVER;
    }
    if (year < 2000 || year > 2100) {
      ctx.addIssue({ code: 'custom', message: 'Date must be between the years 2000 and 2100' });
      return z.NEVER;
    }
    return parsed;
  });

export const transactionSchema = z
  .object({
    amount,
    type,
    category: z.string({ error: 'Category is required' }).trim().min(1, 'Category is required'),
    date,
    paymentMethod,
    note: z.string().trim().max(NOTE_MAX_LENGTH, `Note must be at most ${NOTE_MAX_LENGTH} characters`).default(''),
  })
  .superRefine((data, ctx) => {
    if (!CATEGORIES[data.type].includes(data.category)) {
      ctx.addIssue({
        code: 'custom',
        path: ['category'],
        message: `"${data.category}" is not a valid ${data.type === 'income' ? 'pocket money' : 'expense'} category`,
      });
    }
  });

export const listQuerySchema = z.object({
  month: monthSchema.optional(),
  type: type.optional(),
  category: z.string().trim().max(50).optional(),
  paymentMethod: paymentMethod.optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['-date', 'date', '-amount', 'amount']).default('-date'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const summaryQuerySchema = z.object({
  month: monthSchema.optional(),
  months: z.coerce.number().int().min(1).max(12).default(6),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid transaction id'),
});
