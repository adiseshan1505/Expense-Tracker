import mongoose from 'mongoose';

// Denylist of logged-out JWTs; MongoDB's TTL index purges each entry once the token would have expired anyway.
const revokedTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const RevokedToken = mongoose.model('RevokedToken', revokedTokenSchema);
