import { Router } from 'express';
import controllers from '../controllers/solicitacoesController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import {
	createSolicitacaoSchema,
	deleteSolicitacaoBodySchema,
	listSolicitacoesSchema,
	solicitacaoParamsSchema,
	updateSolicitacaoSchema,
} from '../schemas/solicitacoesSchemas.js';

const router = Router();

router.get('/salas', controllers.getSalas);

router.use(authMiddleware);
router.get('/', validate(listSolicitacoesSchema, 'query'), controllers.list);
router.get('/:cod_sala/:data/:hora', validate(solicitacaoParamsSchema, 'params'), controllers.getByKey);
router.post('/', validate(createSolicitacaoSchema, 'body'), controllers.create);
router.put('/:cod_sala/:data/:hora', validate(solicitacaoParamsSchema, 'params'), validate(updateSolicitacaoSchema, 'body'), controllers.update);
router.delete('/', validate(deleteSolicitacaoBodySchema, 'body'), controllers.remove);
router.delete('/:cod_sala/:data/:hora', validate(solicitacaoParamsSchema, 'params'), controllers.remove);

export default router;
