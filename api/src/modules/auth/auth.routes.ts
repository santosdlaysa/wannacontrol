import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { loginEmailSchema, loginPinSchema, refreshTokenSchema } from '@cafecontrol/shared';
import { asyncHandler } from '../../lib/async-handler';
import * as authController from './auth.controller';

const router = Router();

router.post('/login', validate(loginEmailSchema), asyncHandler(authController.login));
router.post('/login-pin', validate(loginPinSchema), asyncHandler(authController.loginPin));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refresh));

export default router;
