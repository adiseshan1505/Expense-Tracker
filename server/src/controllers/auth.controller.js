import { RevokedToken } from '../models/RevokedToken.js';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { signToken } from '../utils/tokens.js';

const revoke = ({ jti, expiresAt }) =>
  RevokedToken.updateOne({ jti }, { $setOnInsert: { jti, expiresAt } }, { upsert: true });

export async function register(req, res) {
  const { email } = req.valid.body;
  if (await User.exists({ email })) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  const user = await User.create(req.valid.body);
  res.status(201).json({ user, token: signToken(user.id) });
}

export async function login(req, res) {
  const { email, password } = req.valid.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  res.json({ user, token: signToken(user.id) });
}

export async function logout(req, res) {
  await revoke(req.auth);
  res.status(204).end();
}

export function getMe(req, res) {
  res.json({ user: req.user });
}

export async function updateMe(req, res) {
  req.user.set(req.valid.body);
  await req.user.save();
  res.json({ user: req.user });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.valid.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    throw new HttpError(400, 'Current password is incorrect', [
      { field: 'currentPassword', message: 'Current password is incorrect' },
    ]);
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  res.json({ user, token: signToken(user.id) });
}

export async function deleteMe(req, res) {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(req.valid.body.password))) {
    throw new HttpError(400, 'Password is incorrect', [{ field: 'password', message: 'Password is incorrect' }]);
  }

  await Transaction.deleteMany({ user: user._id });
  await user.deleteOne();
  await revoke(req.auth);
  res.status(204).end();
}
