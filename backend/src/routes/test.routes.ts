
import { Router } from 'express';
import { getTestMessage } from '../controllers/test.controller';

const router = Router();

router.get('/', getTestMessage);

export default router;
