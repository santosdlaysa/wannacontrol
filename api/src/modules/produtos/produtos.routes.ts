import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { asyncHandler } from '../../lib/async-handler';
import { upload } from '../../middlewares/upload';
import { Perfil, createProdutoSchema, updateProdutoSchema } from '@cafecontrol/shared';
import * as produtosController from './produtos.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', asyncHandler(produtosController.listar));
router.get('/:id', asyncHandler(produtosController.buscarPorId));
router.post('/', authorize(Perfil.ADMIN, Perfil.GERENTE), validate(createProdutoSchema), asyncHandler(produtosController.criar));
router.put('/:id', authorize(Perfil.ADMIN, Perfil.GERENTE), validate(updateProdutoSchema), asyncHandler(produtosController.atualizar));
router.delete('/:id', authorize(Perfil.ADMIN), asyncHandler(produtosController.remover));
router.post('/:id/imagem', authorize(Perfil.ADMIN, Perfil.GERENTE), upload.single('imagem'), asyncHandler(produtosController.uploadImagem));

export default router;
