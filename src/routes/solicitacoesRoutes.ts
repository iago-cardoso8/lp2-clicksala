import { Router } from 'express';
import controllers from '../controllers/solicitacoesController.js';

const router = Router();

router.get('/', controllers.list);
router.get('/salas', controllers.getSalas);
router.get('/:cod_sala/:data/:hora', controllers.getByKey);
router.post('/', controllers.create);
router.put('/:cod_sala/:data/:hora', controllers.update);
router.delete('/', controllers.remove);
router.delete('/:cod_sala/:data/:hora', controllers.remove);

export default router;
