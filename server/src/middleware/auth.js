import { RevokedToken } from '../models/RevokedToken.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { verifyToken } from '../utils/tokens.js';

const SESSION_INVALID = 'Your session is no longer valid. Please log in again.';

export async function requireAuth(req, _res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Authentication required');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw new HttpError(
      401,
      err.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Invalid token',
    );
  }

  const [user, revoked] = await Promise.all([
    User.findById(payload.sub),
    RevokedToken.exists({ jti: payload.jti }),
  ]);

  if (!user || revoked) throw new HttpError(401, SESSION_INVALID);

  const changedAt = user.passwordChangedAt && Math.floor(user.passwordChangedAt.getTime() / 1000);
  if (changedAt && payload.iat < changedAt) throw new HttpError(401, SESSION_INVALID);

  req.user = user;
  req.auth = { jti: payload.jti, expiresAt: new Date(payload.exp * 1000) };
  next();
}
