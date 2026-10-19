import { Router } from 'express';
import controllers from '../controllers/adminController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import validate from '../middlewares/validate.js';
import { adminListSchema, adminDecisionSchema, solicitacaoParamsSchema } from '../schemas/solicitacoesSchemas.js';
import { createRoomSchema, roomIdParamsSchema } from '../schemas/roomSchemas.js';
import spreadsheetUpload from '../middlewares/spreadsheetUpload.js';

const router = Router();

router.use(authMiddleware, requireAdmin);
router.post('/salas', validate(createRoomSchema, 'body'), controllers.createRoom);
router.delete('/salas/:id', validate(roomIdParamsSchema, 'params'), controllers.deleteRoom);
router.post('/salas/importar', spreadsheetUpload.single('arquivo'), controllers.importRooms);
router.get('/solicitacoes', validate(adminListSchema, 'query'), controllers.listAll);
router.put(
  '/solicitacoes/:cod_sala/:data/:hora',
  validate(solicitacaoParamsSchema, 'params'),
  validate(adminDecisionSchema, 'body'),
  controllers.decide
);

export default router;
