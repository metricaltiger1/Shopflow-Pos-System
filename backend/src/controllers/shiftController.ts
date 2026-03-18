
import { FastifyRequest, FastifyReply } from 'fastify';
import { ShiftService } from '../services/shiftService';

const shiftService = new ShiftService();

export const startShift = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = request.user as { userId: string };
    const shift = await shiftService.startShift(userId);
    reply.send(shift);
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const endShift = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const shift = await shiftService.endShift(id);
    reply.send(shift);
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const getActiveShift = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = request.user as { userId: string };
    const shift = await shiftService.getActiveShift(userId);
    reply.send(shift);
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const getShiftHistory = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { role, userId } = request.user as { role: string; userId: string };
    const queryUserId = role === 'ADMIN' ? undefined : userId;
    
    const shifts = await shiftService.getShiftHistory(queryUserId);
    reply.send(shifts);
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};
