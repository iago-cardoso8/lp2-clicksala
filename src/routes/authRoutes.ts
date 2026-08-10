import { Router } from 'express';
import controllers from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', controllers.register);
router.post('/login', controllers.login);
router.get('/me', authMiddleware, controllers.me);

export default router;
