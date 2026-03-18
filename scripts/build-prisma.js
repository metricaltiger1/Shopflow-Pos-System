const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Prisma for production...');

// Set database URL for production - use a path that doesn't require admin rights
process.env.DATABASE_URL = `file:./data/app.sqlite?connection_limit=1`;

// Use a user-writable directory for data instead of program files
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

try {
  // First, try to generate without force to avoid permission issues
  console.log('1. Generating Prisma client...');
  try {
    execSync('npx prisma generate', { 
      cwd: path.join(__dirname, '..', 'backend'),
      stdio: 'inherit'
    });
  } catch (generateError) {
    console.log('First generate attempt failed, trying with different approach...');
    
    // If generate fails, check if we can use existing client
    const prismaClientPath = path.join(__dirname, '..', 'backend', 'node_modules', '.prisma');
    if (fs.existsSync(prismaClientPath)) {
      console.log('Using existing Prisma client...');
    } else {
      throw new Error('Prisma client generation failed and no existing client found');
    }
  }

  // Create and run migrations
  console.log('2. Creating and running migrations...');
  execSync('npx prisma migrate dev --name init', {
    cwd: path.join(__dirname, '..', 'backend'),
    stdio: 'inherit'
  });

  console.log('Prisma build completed successfully!');
  return true;
} catch (error) {
  console.error('Prisma build failed:', error.message);
  
  // Check if we can continue with existing database
  const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
  if (fs.existsSync(dbPath)) {
    console.log('Using existing database file...');
    return true;
  }
  
  console.error('Cannot continue without database');
  return false;
}