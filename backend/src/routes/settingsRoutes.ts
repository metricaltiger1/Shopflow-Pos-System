
import { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import { getSettings, updateSettings } from '../controllers/settingsController';

export default async function settingsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', getSettings);
  fastify.put('/', updateSettings);
}
