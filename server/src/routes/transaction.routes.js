import { Router } from 'express';
import * as tx from '../controllers/transaction.controller.js';
import { validate } from '../middleware/validate.js';
import {
  idParamSchema,
  listQuerySchema,
  summaryQuerySchema,
  transactionSchema,
} from '../validators/transaction.js';

const router = Router();

router.get('/summary', validate({ query: summaryQuerySchema }), tx.getSummary);

router
  .route('/')
  .get(validate({ query: listQuerySchema }), tx.listTransactions)
  .post(validate({ body: transactionSchema }), tx.createTransaction);

router
  .route('/:id')
  .get(validate({ params: idParamSchema }), tx.getTransaction)
  .put(validate({ params: idParamSchema, body: transactionSchema }), tx.updateTransaction)
  .delete(validate({ params: idParamSchema }), tx.deleteTransaction);

export default router;
