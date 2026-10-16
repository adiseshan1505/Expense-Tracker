import { Router } from 'express';
import {
  CATEGORIES,
  CURRENCY,
  NOTE_MAX_LENGTH,
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  TYPE_LABELS,
} from '../constants/index.js';

const router = Router();

router.get('/', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({
    types: TRANSACTION_TYPES,
    typeLabels: TYPE_LABELS,
    categories: CATEGORIES,
    paymentMethods: PAYMENT_METHODS,
    currency: CURRENCY,
    noteMaxLength: NOTE_MAX_LENGTH,
  });
});

export default router;
