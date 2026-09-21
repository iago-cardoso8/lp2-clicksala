import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';
import controllers from '../controllers/userController.js';
import validate from '../middlewares/validate.js';
import { imageUploadSchema } from '../schemas/uploadSchemas.js';

const router = Router();

router.use(authMiddleware);
router.get('/image', controllers.getImage);
router.post('/image', upload.single('image'), validate(imageUploadSchema, 'file'), controllers.uploadImage);
router.put('/image', upload.single('image'), validate(imageUploadSchema, 'file'), controllers.updateImage);

export default router;
