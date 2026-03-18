import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import route handlers
import { authRoutes } from './routes/authRoutes';
import { productRoutes } from './routes/productRoutes';
import { orderRoutes } from './routes/orderRoutes';
import { shiftRoutes } from './routes/shiftRoutes';
import { reportRoutes } from './routes/reportRoutes';
import settingsRoutes from './routes/settingsRoutes';

// Import Prisma
import prisma from './config/database';

// Determine if we're running in Electron
const isElectron = process.env.ELECTRON === 'true';

// Create uploads directory if it doesn't exist
let uploadsDir: string;

if (isElectron) {
  // In Electron, use resourcesPath for the packaged app
  const resourcesPath = (process as any).resourcesPath;
  uploadsDir = resourcesPath 
    ? join(resourcesPath, 'backend/uploads')
    : join(__dirname, '../uploads');
} else {
  // In development, use the regular path
  uploadsDir = join(__dirname, '../uploads');
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Database check and seed function
async function checkAndSeedDatabase() {
  try {
    // Check if any users exist
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('📊 No users found in database. Seeding default admin user...');
      
      // Import auth utilities
      const { hashPassword } = require('./utils/auth');
      const adminPassword = await hashPassword('Amazon23!');
      
      // Create default admin user
      await prisma.user.create({
        data: {
          username: 'Admin',
          fullName: 'System Administrator',
          email: 'admin@mamaliamfries.com',
          password: adminPassword,
          role: 'Admin',
        },
      });
      
      console.log('✅ Default admin user created successfully!');
      console.log('👤 Username: Admin');
      console.log('🔑 Password: Kenya@50');
      console.log('🎯 Role: Admin');
    } else {
      console.log(`📊 Found ${userCount} existing user(s) in database`);
    }
  } catch (error) {
    console.error('❌ Error checking/seeding database:', error);
  }
}

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        singleLine: true
      }
    }
  },
  disableRequestLogging: true
});

// Log all incoming requests to help debug content-length/body issues
fastify.addHook('onRequest', async (request, reply) => {
  console.log('\n--- Incoming Request ---');
  console.log('Method:', request.method);
  console.log('URL:', request.url);
  console.log('Headers:', request.headers);
});

fastify.addHook('onRequest', async (request, reply) => {
  const contentLength = request.headers['content-length'];
  console.log('Incoming request:', {
    method: request.method,
    url: request.url,
    contentLength,
  });
});

fastify.addHook('onRequest', async (request, reply) => {
  console.log('Headers:', request.headers);
});

fastify.addHook('onError', async (request, reply, error) => {
  console.error('❌ Request failed:', error.message);
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });

  // Multipart for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1
    }
  });

  // Static files - handle different paths for Electron
  await fastify.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false
  });

  await fastify.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/api/uploads/',
    decorateReply: false
  });
}

// Register routes
async function registerRoutes() {
  // Health check with Swagger documentation
  fastify.get('/api/health', {
    schema: {
      tags: ['System'],
      description: 'Health check endpoint',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async () => {
    // Check if Electron is available using type assertion
    const resourcesPath = (process as any).resourcesPath;
    const electronVersion = (process.versions as any).electron;
    
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      electron: isElectron,
      uploadsDir: uploadsDir,
      resourcesPath: resourcesPath || 'not available',
      electronVersion: electronVersion || 'not available'
    };
  });

  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(productRoutes, { prefix: '/api/products' });
  await fastify.register(orderRoutes, { prefix: '/api/orders' });
  await fastify.register(shiftRoutes, { prefix: '/api/shifts' });
  await fastify.register(reportRoutes, { prefix: '/api/reports' });
  await fastify.register(settingsRoutes, { prefix: '/api/settings' });
}

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  reply.status(error.statusCode || 500).send({
    error: {
      message: error.message,
      code: error.code
    }
  });
});

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();
    
    const port = parseInt(process.env.PORT || '3001');
    const host = isElectron ? '127.0.0.1' : process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`🚀 Server listening on http://${host}:${port}`);
    console.log(`💾 Running in Electron: ${isElectron}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    
    // Check and seed database AFTER server starts
    await checkAndSeedDatabase();
    
    // Check if Electron is available using type assertion
    const resourcesPath = (process as any).resourcesPath;
    console.log(`📦 Resources path: ${resourcesPath || 'not available'}`);
    
    console.log(`📚 Swagger UI available at http://${host}:${port}/docs`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();