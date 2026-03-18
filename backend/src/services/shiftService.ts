
import prisma from '../config/database';

export class ShiftService {
  async startShift(userId: string) {
    // End any active shifts for this user
    await prisma.shift.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'ENDED',
        endTime: new Date(),
      },
    });

    // Create new shift
    const shift = await prisma.shift.create({
      data: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return shift;
  }

  async endShift(shiftId: string) {
    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: 'ENDED',
        endTime: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return shift;
  }

  async getActiveShift(userId: string) {
    const shift = await prisma.shift.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    return shift;
  }

  async getShiftHistory(userId?: string) {
    const shifts = await prisma.shift.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        orders: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    return shifts;
  }

  async updateShiftSales(shiftId: string, amount: number) {
    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        totalSales: {
          increment: amount,
        },
        ordersCount: {
          increment: 1,
        },
      },
    });

    return shift;
  }
}
