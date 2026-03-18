import { FastifyRequest, FastifyReply } from 'fastify';
import { ShiftService } from '../services/shiftService';
import { generateSalesReportPDF } from '../utils/pdfGenerator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const shiftService = new ShiftService();

export const getSalesReport = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { role, userId } = request.user as { role: string; userId: string };
    const { startDate, endDate, staffId, period } = request.query as any;
    
    // Get shifts with orders
    const queryUserId = role === 'Admin' && staffId ? staffId : (role === 'Admin' ? undefined : userId);
    const shifts = await shiftService.getShiftHistory(queryUserId);
    
    // Filter by date range if provided
    let filteredShifts = shifts;
    if (startDate || endDate) {
      filteredShifts = shifts.filter((shift: { startTime: string | number | Date; }) => {
        const shiftDate = new Date(shift.startTime);
        if (startDate && shiftDate < new Date(startDate)) return false;
        if (endDate && shiftDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    // Get all orders for these shifts with their items
    const shiftIds = filteredShifts.map((shift: { id: any; }) => shift.id);
    const orders = await prisma.order.findMany({
      where: {
        shiftId: { in: shiftIds }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                category: true
              }
            }
          }
        },
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      }
    });
    
    // Get all users for staff performance
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true
      }
    });
    
    // Get all products for top products calculation
    const products = await prisma.product.findMany();
    
    // Calculate summary
    const totalOrders = filteredShifts.reduce((sum: any, shift: { ordersCount: any; }) => sum + shift.ordersCount, 0);
    const totalRevenue = filteredShifts.reduce((sum: any, shift: { totalSales: any; }) => sum + shift.totalSales, 0);
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate total tax from orders
    const totalTax = orders.reduce((sum: number, order: any) => sum + (order.tax || 0), 0);
    
    // Calculate top products
    const productSalesMap = new Map();
    
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const productId = item.productId;
        if (!productSalesMap.has(productId)) {
          productSalesMap.set(productId, {
            quantity: 0,
            revenue: 0
          });
        }
        const productData = productSalesMap.get(productId);
        productSalesMap.set(productId, {
          quantity: productData.quantity + item.quantity,
          revenue: productData.revenue + (item.price * item.quantity)
        });
      });
    });
    
    const topProducts = Array.from(productSalesMap.entries())
      .map(([productId, salesData]) => {
        const product = products.find((p: any) => p.id === productId);
        return {
          id: productId,
          name: product ? product.name : 'Unknown Product',
          sales: salesData.quantity,
          revenue: salesData.revenue
        };
      })
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);
    
    // Calculate staff performance
    const staffPerformanceMap = new Map();
    
    filteredShifts.forEach((shift: any) => {
      const userId = shift.userId;
      if (!staffPerformanceMap.has(userId)) {
        const user = users.find((u: any) => u.id === userId);
        staffPerformanceMap.set(userId, {
          name: user ? user.username : 'Unknown User',
          sales: 0,
          revenue: 0
        });
      }
      const staffData = staffPerformanceMap.get(userId);
      staffPerformanceMap.set(userId, {
        name: staffData.name,
        sales: staffData.sales + shift.ordersCount,
        revenue: staffData.revenue + shift.totalSales
      });
    });
    
    const staffPerformance = Array.from(staffPerformanceMap.entries())
      .map(([userId, performanceData]) => ({
        id: userId,
        name: performanceData.name,
        sales: performanceData.sales,
        revenue: performanceData.revenue
      }))
      .sort((a: any, b: any) => b.revenue - a.revenue);
    
    // Calculate payment method summary
    const paymentMethods = orders.reduce((acc: any, order: any) => {
      const method = order.paymentMethod || 'CASH';
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 };
      }
      acc[method].count += 1;
      acc[method].amount += order.total;
      return acc;
    }, {});
    
    const paymentMethodSummary = Object.entries(paymentMethods).map(([method, data]: [string, any]) => ({
      method,
      count: data.count,
      amount: data.amount
    }));
    
    // Calculate category sales
    const categorySalesMap = new Map();
    
    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const category = item.product?.category || 'Other';
        
        if (!categorySalesMap.has(category)) {
          categorySalesMap.set(category, {
            itemsSold: 0,
            revenue: 0
          });
        }
        
        const categoryData = categorySalesMap.get(category);
        categorySalesMap.set(category, {
          itemsSold: categoryData.itemsSold + item.quantity,
          revenue: categoryData.revenue + (item.price * item.quantity)
        });
      });
    });
    
    const categorySales = Array.from(categorySalesMap.entries())
      .map(([category, data]: [string, any]) => ({
        name: category,
        itemsSold: data.itemsSold,
        revenue: data.revenue
      }));
    
    // Format orders for response
    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      timestamp: order.timestamp,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      paymentMethod: order.paymentMethod,
      cashierName: order.user?.username || 'Unknown',
      items: order.items.map((item: any) => ({
        productId: item.productId,
        productName: item.product?.name || 'Unknown',
        quantity: item.quantity,
        price: item.price
      }))
    }));
    
    const reportData = {
      summary: {
        totalOrders,
        totalRevenue,
        averageOrder,
        totalTax
      },
      orders: formattedOrders,
      topProducts,
      staffPerformance,
      paymentMethods: paymentMethodSummary,
      categorySales
    };
    
    reply.send(reportData);
  } catch (error) {
    console.error('Error generating sales report:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const generateSalesReportPDFEndpoint = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { role, userId } = request.user as { role: string; userId: string };
    const filters = request.query as any;
    
    const queryUserId = role === 'Admin' && filters.staffId ? filters.staffId : (role === 'Admin' ? undefined : userId);
    const shifts = await shiftService.getShiftHistory(queryUserId);
    
    // Get all orders for these shifts
    const shiftIds = shifts.map((shift: any) => shift.id);
    const orders = await prisma.order.findMany({
      where: {
        shiftId: { in: shiftIds }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        },
        user: {
          select: {
            username: true
          }
        }
      }
    });
    
    const reportData = {
      summary: {
        totalOrders: shifts.reduce((sum: any, shift: any) => sum + shift.ordersCount, 0),
        totalRevenue: shifts.reduce((sum: any, shift: any) => sum + shift.totalSales, 0),
        averageOrder: shifts.length > 0 ? 
          shifts.reduce((sum: any, shift: any) => sum + shift.totalSales, 0) / 
          shifts.reduce((sum: any, shift: any) => sum + shift.ordersCount, 0) : 0,
      },
      shifts,
      orders: orders.map((order: any) => ({
        ...order,
        cashierName: order.user?.username || 'Unknown'
      }))
    };
    
    const pdfBuffer = generateSalesReportPDF(reportData, filters);
    
    reply
      .type('application/pdf')
      .header('Content-Disposition', `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.pdf"`)
      .send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};