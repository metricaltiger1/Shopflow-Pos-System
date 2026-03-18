
import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/orderService';
import { generateReceiptPDF } from '../utils/pdfGenerator';

const orderService = new OrderService();

export const createOrder = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { userId } = request.user as { userId: string };
    const orderData = request.body as any;
    
    const order = await orderService.createOrder(userId, orderData);
    reply.status(201).send(order);
  } catch (error: any) {
    reply.status(400).send({ error: error.message });
  }
};

export const getOrders = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { role, userId } = request.user as { role: string; userId: string };
    const { shiftId } = request.query as { shiftId?: string };
    
    const queryUserId = role === 'Admin' ? undefined : userId;
    const orders = await orderService.getOrders(queryUserId, shiftId);
    
    reply.send(orders);
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const getOrder = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const order = await orderService.getOrderById(id);
    
    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }
    
    reply.send(order);
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const generateReceipt = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const order = await orderService.getOrderById(id);
    
    if (!order) {
      return reply.status(404).send({ error: 'Order not found' });
    }
    
    const pdfBuffer = generateReceiptPDF(order);
    
    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment; filename="receipt-${order.id}.pdf"`)
      .send(pdfBuffer);
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};
