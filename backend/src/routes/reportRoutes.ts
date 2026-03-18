
import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import * as reportController from '../controllers/reportController';

export const reportRoutes = async (fastify: FastifyInstance) => {
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', authenticate);
    
    fastify.get('/sales', reportController.getSalesReport);
    fastify.get('/sales/pdf', reportController.generateSalesReportPDFEndpoint);
  });
};
