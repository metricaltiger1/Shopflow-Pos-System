import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/productService';
import { saveUploadedFile, generateFilename } from '../utils/fileUpload';

const productService = new ProductService();

// Helper function to parse tags safely
function parseTags(tagsValue: any): string[] {
  if (!tagsValue) return [];
  
  if (Array.isArray(tagsValue)) {
    return tagsValue;
  }
  
  if (typeof tagsValue === 'string') {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(tagsValue);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // If JSON parsing fails, treat as comma-separated string
      return tagsValue.split(',').map((tag: string) => tag.trim()).filter(Boolean);
    }
  }
  
  return [];
}

// Helper function to safely extract field value
function getFieldValue(field: any): string | undefined {
  if (!field) return undefined;
  if (Array.isArray(field)) {
    return field[0]?.value;
  }
  return field.value;
}

export const getProducts = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const products = await productService.getAllProducts();
    reply.send(products);
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const getProduct = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const product = await productService.getProductById(id);
    
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }
    
    reply.send(product);
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const createProduct = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const data = await request.file();
    let productImage: string | undefined;
    let productData: any = {};

    if (data) {
      const fields = data.fields;
      
      // Extract fields safely
      productData = {
        name: getFieldValue(fields.name),
        description: getFieldValue(fields.description),
        category: getFieldValue(fields.category),
        price: getFieldValue(fields.price) ? parseFloat(getFieldValue(fields.price)!) : 0,
        stock: getFieldValue(fields.stock) ? parseInt(getFieldValue(fields.stock)!) : 0,
        tags: parseTags(getFieldValue(fields.tags))
      };

      if (data.file) {
        const filename = generateFilename(data.filename);
        productImage = await saveUploadedFile(data.file, filename, 'product');
      }
    } else {
      // Handle JSON body
      const body = request.body as any;
      productData = {
        name: body?.name,
        description: body?.description,
        category: body?.category,
        price: body?.price ? parseFloat(body.price) : 0,
        stock: body?.stock ? parseInt(body.stock) : 0,
        tags: parseTags(body?.tags)
      };
    }

    // Validate required fields
    if (!productData.name || !productData.price || !productData.category || !productData.description || productData.stock === undefined) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    const product = await productService.createProduct(productData, productImage);
    reply.status(201).send(product);
  } catch (error) {
    console.error('Create product error:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};

export const updateProduct = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };

    // Get existing product first
    const existingProduct = await productService.getProductById(id);
    if (!existingProduct) {
      return reply.status(404).send({ error: 'Product not found' });
    }

    let productImage: string | undefined = existingProduct.image ?? undefined;
    const productData: any = {};
    let hasFile = false;

    // Process multipart data
    const parts = request.parts();
    
    for await (const part of parts) {
      if (part.type === 'file') {
        hasFile = true;
        try {
          const filename = generateFilename(part.filename);
          productImage = await saveUploadedFile(part.file, filename, 'product');
        } catch (fileError) {
          console.error('File upload error:', fileError);
          return reply.status(400).send({ error: 'Failed to upload image' });
        }
      } else if (part.type === 'field') {
        // Handle form fields
        const value = part.value;
        if (part.fieldname === 'tags') {
          productData.tags = parseTags(value);
        } else if (part.fieldname === 'price' || part.fieldname === 'stock') {
          productData[part.fieldname] = parseFloat(String(value));
        } else {
          productData[part.fieldname] = value;
        }
      }
    }

    // If no file was uploaded but we expected one, keep the existing image
    if (!hasFile) {
      productImage = existingProduct.image ?? undefined;
    }

    // Merge with existing data for partial updates
    const finalProductData = {
      name: productData.name || existingProduct.name,
      description: productData.description || existingProduct.description,
      category: productData.category || existingProduct.category,
      price: productData.price !== undefined ? productData.price : existingProduct.price,
      stock: productData.stock !== undefined ? productData.stock : existingProduct.stock,
      tags: productData.tags || existingProduct.tags
    };

    // Validate required fields
    if (!finalProductData.name || !finalProductData.category || !finalProductData.description) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    const product = await productService.updateProduct(id, finalProductData, productImage);
    reply.send(product);
  } catch (error) {
    console.error("Update product error:", error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};
export const deleteProduct = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    await productService.deleteProduct(id);
    reply.status(204).send();
  } catch (error) {
    reply.status(500).send({ error: 'Internal server error' });
  }
};