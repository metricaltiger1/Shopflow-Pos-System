
import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import * as orderController from '../controllers/orderController';

export const orderRoutes = async (fastify: FastifyInstance) => {
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', authenticate);
    
    fastify.post('/', orderController.createOrder);
    fastify.get('/', orderController.getOrders);
    fastify.get('/:id', orderController.getOrder);
    fastify.get('/:id/receipt', orderController.generateReceipt);
  });
};
