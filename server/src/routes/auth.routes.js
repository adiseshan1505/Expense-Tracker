import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import {
  changePasswordSchema,
  deleteAccountSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from '../validators/auth.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), auth.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), auth.login);
router.post('/logout', requireAuth, auth.logout);

router
  .route('/me')
  .all(requireAuth)
  .get(auth.getMe)
  .patch(validate({ body: updateProfileSchema }), auth.updateMe)
  .delete(validate({ body: deleteAccountSchema }), auth.deleteMe);

router.put('/password', requireAuth, validate({ body: changePasswordSchema }), auth.changePassword);

export default router;
