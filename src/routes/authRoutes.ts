import { Router } from 'express';
import controllers from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import authRateLimit from '../middlewares/rateLimit.js';
import { loginSchema, registerSchema } from '../schemas/authSchemas.js';

const router = Router();

router.post('/register', authRateLimit, validate(registerSchema, 'body'), controllers.register);
router.post('/login', authRateLimit, validate(loginSchema, 'body'), controllers.login);
router.post('/logout', controllers.logout);
router.get('/me', authMiddleware, controllers.me);

export default router;
