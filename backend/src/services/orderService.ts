
import prisma from '../config/database';
import { CreateOrderRequest } from '../types';
import { ShiftService } from './shiftService';
import { ProductService } from './productService';

export class OrderService {
  private shiftService = new ShiftService();
  private productService = new ProductService();

  async createOrder(userId: string, orderData: CreateOrderRequest) {
    // Calculate totals
    let subtotal = 0;
    const orderItems: { productId: string; quantity: number; price: any; }[] = [];

    for (const item of orderData.items) {
      const product = await this.productService.getProductById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });
    }

    const tax = subtotal * 0.16; // 16% VAT
    const total = subtotal + tax;

    // Create order with transaction
    const order = await prisma.$transaction(async (tx: { order: { create: (arg0: { data: { userId: string; shiftId: string; subtotal: number; tax: number; total: number; paymentMethod: "CASH" | "CARD" | "MOBILE"; items: { create: { productId: string; quantity: number; price: any; }[]; }; }; include: { items: { include: { product: boolean; }; }; user: { select: { fullName: boolean; }; }; shift: boolean; }; }) => any; }; product: { update: (arg0: { where: { id: string; }; data: { stock: { decrement: number; }; }; }) => any; }; }) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          shiftId: orderData.shiftId,
          subtotal,
          tax,
          total,
          paymentMethod: orderData.paymentMethod,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: {
            select: {
              fullName: true,
            },
          },
          shift: true,
        },
      });

      // Update product stock
      for (const item of orderData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    // Update shift totals
    await this.shiftService.updateShiftSales(orderData.shiftId, total);

    return order;
  }

  async getOrders(userId?: string, shiftId?: string) {
    const orders = await prisma.order.findMany({
      where: {
        ...(userId && { userId }),
        ...(shiftId && { shiftId }),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            fullName: true,
          },
        },
        shift: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    return orders;
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            fullName: true,
          },
        },
        shift: true,
      },
    });

    return order;
  }
}
