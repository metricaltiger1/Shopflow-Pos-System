
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/auth';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      username: string;
      role: string;
      profileImage?: string;
    };
  }
}

export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Authorization header required' });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    request.user = payload;
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user || request.user.role !== 'Admin') {
    return reply.status(403).send({ error: 'Admin access required' });
  }
};
