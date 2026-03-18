
import { FastifyRequest } from 'fastify';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

export const createDirectories = () => {
  const profileDir = join(process.cwd(), 'profile_images');
  const productDir = join(process.cwd(), 'product_images');
  
  if (!existsSync(profileDir)) {
    mkdirSync(profileDir, { recursive: true });
  }
  
  if (!existsSync(productDir)) {
    mkdirSync(productDir, { recursive: true });
  }
};

// utils/fileUpload.ts

export const saveUploadedFile = async (
  data: AsyncIterable<Buffer>,
  filename: string,
  type: 'profile' | 'product'
): Promise<string> => {
  const folder = type === 'profile' ? 'profile_images' : 'product_images';
  // Use the same uploads directory as configured in Fastify
  const uploadsDir = join(__dirname, '../../uploads');
  const filepath = join(uploadsDir, folder, filename);
  
  // Ensure directory exists
  if (!existsSync(join(uploadsDir, folder))) {
    mkdirSync(join(uploadsDir, folder), { recursive: true });
  }
  
  const writeStream = createWriteStream(filepath);
  await pipeline(data, writeStream);
  
  // Return path that matches the static file serving route
  return `/uploads/${folder}/${filename}`;
};

export const generateFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  return `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
};
