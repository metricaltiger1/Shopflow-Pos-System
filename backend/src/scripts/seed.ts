import prisma from "../config/database";
import { hashPassword } from "../utils/auth";


async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create default admin user with Kenya@50 password
    const adminPassword = await hashPassword('Amazon23!');
    const admin = await prisma.user.upsert({
      where: { username: 'Admin' },
      update: {},
      create: {
        username: 'Admin',
        fullName: 'System Administrator',
        email: 'admin@mamaliamfries.com',
        password: adminPassword,
        role: 'Admin',
      },
    });

    console.log('✅ Database seeded successfully!');
    console.log(`👤 Admin user created:`);
    console.log(`   Username: Admin`);
    console.log(`   Password: Kenya@Amazon23!`);
    console.log(`   Role: Admin`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seed();