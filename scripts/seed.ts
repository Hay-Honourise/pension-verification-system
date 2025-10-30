import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@oyopension.com' },
    update: {
      updatedAt: new Date()
    },
    create: {
      id: `admin_${Date.now()}`,
      email: 'admin@oyopension.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'admin',
      updatedAt: new Date()
    }
  });

  console.log('✅ Admin user created:', admin.email);

  // Create sample pensioners
  const pensioners = await Promise.all([
    prisma.pensioner.upsert({
      where: { pensionId: 'PEN001' },
      update: {
        updatedAt: new Date()
      },
      create: {
        pensionId: 'PEN001',
        fullName: 'John Doe',
        nin: '12345678901',
        dateOfBirth: new Date('1950-05-15'),
        gender: 'male',
        email: 'john.doe@example.com',
        phone: '+2348012345678',
        residentialAddress: '123 Main Street, Ibadan, Oyo State',
        pensionSchemeType: 'total',
        dateOfFirstAppointment: new Date('1980-01-15'),
        dateOfRetirement: new Date('2015-03-20'),
        pfNumber: 'PF001',
        lastPromotionDate: new Date('2010-06-15'),
        currentLevel: 'Level 12',
        salary: 150000.00,
        maidenName: null,
        password: await bcrypt.hash('password123', 12),
        status: 'PENDING_VERIFICATION',
        updatedAt: new Date()
      }
    }),
    prisma.pensioner.upsert({
      where: { pensionId: 'PEN002' },
      update: {
        updatedAt: new Date()
      },
      create: {
        pensionId: 'PEN002',
        fullName: 'Jane Smith',
        nin: '12345678902',
        dateOfBirth: new Date('1948-12-10'),
        gender: 'female',
        email: 'jane.smith@example.com',
        phone: '+2348098765432',
        residentialAddress: '456 Oak Avenue, Ibadan, Oyo State',
        pensionSchemeType: 'contributory',
        dateOfFirstAppointment: new Date('1978-06-20'),
        dateOfRetirement: new Date('2013-07-15'),
        pfNumber: 'PF002',
        lastPromotionDate: new Date('2008-03-10'),
        currentLevel: 'Level 14',
        salary: 180000.00,
        maidenName: 'Johnson',
        password: await bcrypt.hash('password123', 12),
        status: 'VERIFIED',
        updatedAt: new Date()
      }
    })
  ]);

  console.log('✅ Sample pensioners created:', pensioners.length);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
