
import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import * as shiftController from '../controllers/shiftController';

export const shiftRoutes = async (fastify: FastifyInstance) => {
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', authenticate);
    
    fastify.post('/start', shiftController.startShift);
    fastify.put('/:id/end', shiftController.endShift);
    fastify.get('/active', shiftController.getActiveShift);
    fastify.get('/history', shiftController.getShiftHistory);
  });
};
