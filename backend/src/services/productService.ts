
import prisma from '../config/database';
import { CreateProductRequest } from '../types';

export class ProductService {
  async getAllProducts() {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product: { tags: any; }) => ({
      ...product,
      tags: product.tags ? JSON.parse(product.tags as any) : [],
    }));
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) return null;

    return {
      ...product,
      tags: product.tags ? JSON.parse(product.tags as any) : [],
    };
  }

  async createProduct(productData: CreateProductRequest, image?: string) {
    const product = await prisma.product.create({
      data: {
        ...productData,
        image,
        tags: productData.tags ? JSON.stringify(productData.tags) : '[]',
      },
    });

    return {
      ...product,
      tags: product.tags ? JSON.parse(product.tags as any) : [],
    };
  }

  async updateProduct(id: string, productData: Partial<CreateProductRequest>, image?: string) {
    const updateData: any = { ...productData };
    
    if (productData.tags) {
      updateData.tags = JSON.stringify(productData.tags);
    }
    
    if (image !== undefined) {
      updateData.image = image;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    }); 

    return {
      ...product,
      tags: product.tags ? JSON.parse(product.tags as any) : [],
    };
  }

  async deleteProduct(id: string) {
    await prisma.product.delete({
      where: { id },
    });
  }

  async updateStock(id: string, quantity: number) {
    const product = await prisma.product.update({
      where: { id },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    return {
      ...product,
      tags: product.tags ? JSON.parse(product.tags as any) : [],
    };
  }
}
