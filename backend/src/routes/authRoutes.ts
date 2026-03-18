
import { FastifyInstance } from 'fastify';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as authController from '../controllers/authController';

export const authRoutes = async (fastify: FastifyInstance) => {
  // Public routes
  fastify.post('/login', authController.login);
  
  // Protected routes
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', authenticate);
    
    // Admin only routes
    fastify.register(async function (fastify) {
      fastify.addHook('preHandler', requireAdmin);
      
      fastify.get('/users', authController.getUsers);
      fastify.post('/users', authController.createUser);
      fastify.put('/users/:id', authController.updateUser);
      fastify.delete('/users/:id', authController.deleteUser);
    });
  });
};
