
import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as productController from '../controllers/productController';

export const productRoutes = async (fastify: FastifyInstance) => {
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', authenticate);
    
    // All authenticated users can view products
    fastify.get('/', productController.getProducts);
    fastify.get('/:id', productController.getProduct);
    
    // Admin only routes
    fastify.register(async function (fastify) {
      fastify.addHook('preHandler', requireAdmin);
      
      fastify.post('/', productController.createProduct); 
      fastify.put('/:id', productController.updateProduct);
      fastify.delete('/:id', productController.deleteProduct);
    });
  });
};
