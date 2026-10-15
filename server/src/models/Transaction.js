import mongoose from 'mongoose';
import {
  CATEGORIES,
  NOTE_MAX_LENGTH,
  PAYMENT_METHOD_VALUES,
  TRANSACTION_TYPES,
} from '../constants/index.js';
import { toJSONOptions } from './toJSON.js';

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    category: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          return CATEGORIES[this.type]?.includes(value) ?? false;
        },
        message: (props) => `"${props.value}" is not a valid category`,
      },
    },
    date: { type: Date, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHOD_VALUES, required: true },
    note: { type: String, trim: true, maxlength: NOTE_MAX_LENGTH, default: '' },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, category: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
