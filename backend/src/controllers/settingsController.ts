import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../config/database';

export const getSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    let settings = await prisma.setting.findUnique({
      where: { id: '1' }
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          id: '1',
          shopName: 'My Shop',
          address: '',
          phone: '',
          email: '',
          vatRate: 16.0,
          vatInclusive: false,
          currency: 'KES',
          enableLowStockAlerts: true,
          lowStockThreshold: 5
        }
      });
    }

    reply.send(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const updateSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { role } = request.user as { role: string };
    
    if (role !== 'Admin') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const settingsData = request.body as any;
    
    // Remove id, createdAt, and updatedAt from the update data as they shouldn't be modified
    const { id, createdAt, updatedAt, ...updateData } = settingsData;
    
    const settings = await prisma.setting.upsert({
      where: { id: '1' },
      update: updateData,
      create: {
        id: '1',
        shopName: updateData.shopName || 'My Shop',
        address: updateData.address || '',
        phone: updateData.phone || '',
        email: updateData.email || '',
        vatRate: updateData.vatRate || 1.0,
        vatInclusive: updateData.vatInclusive || false,
        currency: updateData.currency || 'KES',
        logo: updateData.logo || null,
        enableLowStockAlerts: updateData.enableLowStockAlerts !== undefined ? updateData.enableLowStockAlerts : true,
        lowStockThreshold: updateData.lowStockThreshold || 5
      }
    });

    reply.send(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};