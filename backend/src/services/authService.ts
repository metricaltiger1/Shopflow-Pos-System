
import prisma from '../config/database';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { AuthUser, CreateUserRequest, Role } from '../types';

export class AuthService {
  async login(username: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return null;
    }

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role as Role,
    });

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role as Role,
      profileImage: user.profileImage?? undefined,
    };

    return { user: authUser, token };
  }

  async createUser(
    userData: CreateUserRequest, 
    profileImage?: string
  ): Promise<AuthUser> {
    // Validate required fields
    if (!userData.username || !userData.password) {
      throw new Error('Username and password are required');
    }

    const hashedPassword = await hashPassword(userData.password);

    // Use the exact same logic as update
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        fullName: userData.fullName,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'CASHIER',
        profileImage: profileImage || null, // Same as update
      },
    });

    // Return the exact same structure as update
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role as Role,
      profileImage: user.profileImage ?? undefined,
    };
  }
  async getUserById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role as Role,
      profileImage: user.profileImage?? undefined,
    };
  }

async getAllUsers(): Promise<AuthUser[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      role: true,
      profileImage: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role as Role,
    profileImage: user.profileImage ?? undefined, 
  }));
}

  async updateUser(id: string, userData: Partial<CreateUserRequest>, profileImage?: string): Promise<AuthUser> {
    const updateData: any = { ...userData };
    
    if (userData.password) {
      updateData.password = await hashPassword(userData.password);
    }
    
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role as Role,
      profileImage: user.profileImage?? undefined,
    };
  }

  async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }
}
