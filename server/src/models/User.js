import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { CURRENCIES } from '../constants/index.js';
import { toJSONOptions } from './toJSON.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    currency: { type: String, enum: CURRENCIES, default: 'INR' },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true, toJSON: toJSONOptions },
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);
