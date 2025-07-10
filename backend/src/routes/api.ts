
import { Router } from 'express';
import testRoutes from './test.routes';
// Import other route handlers here

const router = Router();

// Hook up route handlers
router.use('/test', testRoutes);
// e.g. router.use('/users', userRoutes);

export default router;
