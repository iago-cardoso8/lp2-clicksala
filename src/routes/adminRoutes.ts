import { Router } from 'express';
import controllers from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import validate from '../middlewares/validate.js';
import { adminListSchema, adminDecisionSchema, solicitacaoParamsSchema } from '../schemas/solicitacoesSchemas.js';

const router = Router();

router.use(authMiddleware, requireAdmin);
router.get('/solicitacoes', validate(adminListSchema, 'query'), controllers.listAll);
router.put(
  '/solicitacoes/:cod_sala/:data/:hora',
  validate(solicitacaoParamsSchema, 'params'),
  validate(adminDecisionSchema, 'body'),
  controllers.decide
);

export default router;
