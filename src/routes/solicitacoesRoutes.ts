import { Router } from 'express';
import controllers from '../controllers/solicitacoesController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/salas', controllers.getSalas);

router.use(authMiddleware);
router.get('/', controllers.list);
router.get('/:cod_sala/:data/:hora', controllers.getByKey);
router.post('/', controllers.create);
router.put('/:cod_sala/:data/:hora', controllers.update);
router.delete('/', controllers.remove);
router.delete('/:cod_sala/:data/:hora', controllers.remove);

export default router;
