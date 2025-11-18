import { PrismaClient, UserRole, RiderStatus, VehicleType, RideStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in order to avoid foreign key constraints)
  console.log('🧹 Cleaning existing data...');
  await prisma.rating.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.adminLog.deleteMany();

  console.log('✓ Database cleaned');

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ============================================
  // CREATE ADMIN USER
  // ============================================
  console.log('👤 Creating admin user...');
  const admin = await prisma.user.create({
    data: {
      phone: '+2348012345678',
      name: 'Admin User',
      email: 'admin@pickup.ng',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isPhoneVerified: true,
      isEmailVerified: true,
    },
  });
  console.log('✓ Admin created:', admin.email);

  // ============================================
  // CREATE TEST USERS
  // ============================================
  console.log('👥 Creating test users...');
  
  const user1 = await prisma.user.create({
    data: {
      phone: '+2348023456789',
      name: 'Ebis Okoro',
      email: 'ebis@example.com',
      password: hashedPassword,
      role: UserRole.USER,
      isPhoneVerified: true,
      address: 'Victoria Island, Lagos',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      phone: '+2348034567890',
      name: 'Chidi Adeyemi',
      email: 'chidi@example.com',
      password: hashedPassword,
      role: UserRole.USER,
      isPhoneVerified: true,
      address: 'Lekki, Lagos',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      phone: '+2348045678901',
      name: 'Amina Mohammed',
      email: 'amina@example.com',
      password: hashedPassword,
      role: UserRole.USER,
      isPhoneVerified: true,
      address: 'Ikeja, Lagos',
    },
  });

  console.log(`✓ Created ${3} test users`);

  // ============================================
  // CREATE TEST COMPANY
  // ============================================
  console.log('🏢 Creating test company...');
  
  const company = await prisma.company.create({
    data: {
      name: 'Swift Logistics Ltd',
      registrationNumber: 'RC123456',
      email: 'info@swiftlogistics.ng',
      phone: '+2348056789012',
      address: '15 Broad Street',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      contactPersonName: 'Tunde Bakare',
      contactPersonPhone: '+2348067890123',
      contactPersonEmail: 'tunde@swiftlogistics.ng',
      status: 'APPROVED',
      totalRiders: 0,
      activeRiders: 0,
      approvedAt: new Date(),
    },
  });

  console.log('✓ Company created:', company.name);

  // ============================================
  // CREATE TEST RIDERS
  // ============================================
  console.log('🏍️ Creating test riders...');

  // Rider 1 - Independent Bike Rider (Approved)
  const rider1User = await prisma.user.create({
    data: {
      phone: '+2348078901234',
      name: 'Musa Ibrahim',
      email: 'musa@example.com',
      password: hashedPassword,
      role: UserRole.RIDER,
      isPhoneVerified: true,
      address: 'Surulere, Lagos',
    },
  });

  const rider1 = await prisma.rider.create({
    data: {
      userId: rider1User.id,
      vehicleType: VehicleType.BIKE,
      vehicleMake: 'Bajaj',
      vehicleModel: 'Boxer',
      vehicleYear: 2022,
      vehicleColor: 'Red',
      plateNumber: 'LSR-234-AB',
      licenseNumber: 'LIC-123456',
      status: RiderStatus.APPROVED,
      isAvailable: true,
      isOnline: true,
      currentLatitude: 6.5244,
      currentLongitude: 3.3792,
      lastLocationUpdate: new Date(),
      rating: 4.8,
      completedRides: 145,
      totalRides: 150,
      totalEarnings: 287500,
      approvedAt: new Date(),
    },
  });

  // Rider 2 - Independent Bike Rider (Approved)
  const rider2User = await prisma.user.create({
    data: {
      phone: '+2348089012345',
      name: 'Chioma Okafor',
      email: 'chioma@example.com',
      password: hashedPassword,
      role: UserRole.RIDER,
      isPhoneVerified: true,
      address: 'Yaba, Lagos',
    },
  });

  const rider2 = await prisma.rider.create({
    data: {
      userId: rider2User.id,
      vehicleType: VehicleType.BIKE,
      vehicleMake: 'TVS',
      vehicleModel: 'Apache',
      vehicleYear: 2023,
      vehicleColor: 'Black',
      plateNumber: 'LSR-567-CD',
      licenseNumber: 'LIC-234567',
      status: RiderStatus.APPROVED,
      isAvailable: true,
      isOnline: true,
      currentLatitude: 6.4698,
      currentLongitude: 3.5852,
      lastLocationUpdate: new Date(),
      rating: 4.9,
      completedRides: 98,
      totalRides: 100,
      totalEarnings: 196000,
      approvedAt: new Date(),
    },
  });

  // Rider 3 - Company Bike Rider (Approved)
  const rider3User = await prisma.user.create({
    data: {
      phone: '+2348090123456',
      name: 'Adebayo Olawale',
      email: 'adebayo@example.com',
      password: hashedPassword,
      role: UserRole.RIDER,
      isPhoneVerified: true,
      address: 'Maryland, Lagos',
    },
  });

  const rider3 = await prisma.rider.create({
    data: {
      userId: rider3User.id,
      vehicleType: VehicleType.BIKE,
      vehicleMake: 'Suzuki',
      vehicleModel: 'GSX',
      vehicleYear: 2023,
      vehicleColor: 'Blue',
      plateNumber: 'LSR-890-EF',
      licenseNumber: 'LIC-345678',
      status: RiderStatus.APPROVED,
      isAvailable: false,
      isOnline: false,
      currentLatitude: 6.5795,
      currentLongitude: 3.3211,
      lastLocationUpdate: new Date(),
      rating: 4.7,
      completedRides: 67,
      totalRides: 70,
      totalEarnings: 134000,
      companyId: company.id,
      approvedAt: new Date(),
    },
  });

  // Rider 4 - Pending Approval
  const rider4User = await prisma.user.create({
    data: {
      phone: '+2348091234567',
      name: 'Fatima Hassan',
      email: 'fatima@example.com',
      password: hashedPassword,
      role: UserRole.RIDER,
      isPhoneVerified: true,
      address: 'Gbagada, Lagos',
    },
  });

  const rider4 = await prisma.rider.create({
    data: {
      userId: rider4User.id,
      vehicleType: VehicleType.BIKE,
      vehicleMake: 'Honda',
      vehicleModel: 'CBR',
      vehicleYear: 2022,
      vehicleColor: 'White',
      plateNumber: 'LSR-123-GH',
      licenseNumber: 'LIC-456789',
      status: RiderStatus.PENDING,
      isAvailable: false,
      isOnline: false,
    },
  });

  console.log(`✓ Created ${4} test riders`);

  // Update company stats
  await prisma.company.update({
    where: { id: company.id },
    data: {
      totalRiders: 1,
      activeRiders: 0,
    },
  });

  // ============================================
  // CREATE TEST RIDES
  // ============================================
  console.log('🚗 Creating test rides...');

  // Completed Ride 1
  const ride1 = await prisma.ride.create({
    data: {
      userId: user1.id,
      riderId: rider1.id,
      vehicleType: VehicleType.BIKE,
      pickupLatitude: 6.5244,
      pickupLongitude: 3.3792,
      pickupAddress: 'Computer Village, Ikeja, Lagos',
      dropoffLatitude: 6.4698,
      dropoffLongitude: 3.5852,
      dropoffAddress: 'Lekki Phase 1, Lagos',
      distance: 12.5,
      duration: 35,
      baseFare: 200,
      perKmRate: 100,
      totalFare: 1450,
      promoDiscount: 0,
      finalFare: 1450,
      status: RideStatus.COMPLETED,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.COMPLETED,
      acceptedAt: new Date(Date.now() - 3600000),
      arrivedAt: new Date(Date.now() - 3000000),
      startedAt: new Date(Date.now() - 2700000),
      completedAt: new Date(Date.now() - 600000),
    },
  });

  // Create rating for completed ride
  await prisma.rating.create({
    data: {
      rideId: ride1.id,
      fromUserId: user1.id,
      toUserId: rider1User.id,
      rating: 5,
      comment: 'Great rider! Very professional and fast.',
    },
  });

  // Completed Ride 2
  const ride2 = await prisma.ride.create({
    data: {
      userId: user2.id,
      riderId: rider2.id,
      vehicleType: VehicleType.BIKE,
      pickupLatitude: 6.5795,
      pickupLongitude: 3.3211,
      pickupAddress: 'Maryland Mall, Lagos',
      dropoffLatitude: 6.4368,
      dropoffLongitude: 3.4106,
      dropoffAddress: 'Victoria Island, Lagos',
      distance: 8.3,
      duration: 25,
      baseFare: 200,
      perKmRate: 100,
      totalFare: 1030,
      promoDiscount: 0,
      finalFare: 1030,
      status: RideStatus.COMPLETED,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.COMPLETED,
      acceptedAt: new Date(Date.now() - 7200000),
      arrivedAt: new Date(Date.now() - 6600000),
      startedAt: new Date(Date.now() - 6300000),
      completedAt: new Date(Date.now() - 4800000),
    },
  });

  await prisma.rating.create({
    data: {
      rideId: ride2.id,
      fromUserId: user2.id,
      toUserId: rider2User.id,
      rating: 4,
      comment: 'Good service, but took a bit longer than expected.',
    },
  });

  // Active Ride (In Progress)
  const ride3 = await prisma.ride.create({
    data: {
      userId: user3.id,
      riderId: rider1.id,
      vehicleType: VehicleType.BIKE,
      pickupLatitude: 6.4368,
      pickupLongitude: 3.4106,
      pickupAddress: 'Eko Hotel, Victoria Island',
      dropoffLatitude: 6.4541,
      dropoffLongitude: 3.3947,
      dropoffAddress: 'National Stadium, Surulere',
      distance: 6.2,
      duration: 20,
      baseFare: 200,
      perKmRate: 100,
      totalFare: 820,
      promoDiscount: 0,
      finalFare: 820,
      status: RideStatus.IN_PROGRESS,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PENDING,
      acceptedAt: new Date(Date.now() - 900000),
      arrivedAt: new Date(Date.now() - 600000),
      startedAt: new Date(Date.now() - 300000),
    },
  });

  // Pending Ride
  const ride4 = await prisma.ride.create({
    data: {
      userId: user1.id,
      vehicleType: VehicleType.BIKE,
      pickupLatitude: 6.5244,
      pickupLongitude: 3.3792,
      pickupAddress: 'Allen Avenue, Ikeja',
      dropoffLatitude: 6.6018,
      dropoffLongitude: 3.3515,
      dropoffAddress: 'Ikotun, Lagos',
      distance: 15.0,
      duration: 40,
      baseFare: 200,
      perKmRate: 100,
      totalFare: 1700,
      promoDiscount: 0,
      finalFare: 1700,
      status: RideStatus.PENDING,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.PENDING,
    },
  });

  console.log(`✓ Created ${4} test rides`);

  // ============================================
  // CREATE PROMO CODES
  // ============================================
  console.log('🎟️ Creating promo codes...');

  await prisma.promoCode.create({
    data: {
      code: 'WELCOME50',
      description: 'Welcome bonus - 50% off first ride',
      type: 'PERCENTAGE',
      value: 50,
      maxDiscount: 500,
      minRideAmount: 500,
      maxUsage: 1000,
      maxUsagePerUser: 1,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  await prisma.promoCode.create({
    data: {
      code: 'LAGOS100',
      description: '₦100 off your ride',
      type: 'FIXED_AMOUNT',
      value: 100,
      minRideAmount: 500,
      maxUsage: 500,
      maxUsagePerUser: 3,
      isActive: true,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
  });

  console.log('✓ Created 2 promo codes');

  // ============================================
  // CREATE NOTIFICATIONS
  // ============================================
  console.log('🔔 Creating sample notifications...');

  await prisma.notification.create({
    data: {
      userId: user1.id,
      type: 'RIDE_COMPLETED',
      title: 'Ride Completed',
      message: 'Your ride to Lekki Phase 1 has been completed. Total: ₦1,450',
      data: { rideId: ride1.id },
      isRead: true,
      readAt: new Date(),
    },
  });

  await prisma.notification.create({
    data: {
      userId: user1.id,
      type: 'PROMO_AVAILABLE',
      title: 'New Promo Code!',
      message: 'Use code WELCOME50 for 50% off your first ride!',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: rider1User.id,
      type: 'RIDE_REQUEST',
      title: 'New Ride Request',
      message: 'You have a new ride request from Allen Avenue',
      data: { rideId: ride4.id },
      isRead: false,
    },
  });

  console.log('✓ Created 3 sample notifications');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Admin users: 1`);
  console.log(`   - Regular users: 3`);
  console.log(`   - Riders: 4 (3 approved, 1 pending)`);
  console.log(`   - Companies: 1`);
  console.log(`   - Rides: 4 (2 completed, 1 in progress, 1 pending)`);
  console.log(`   - Ratings: 2`);
  console.log(`   - Promo codes: 2`);
  console.log(`   - Notifications: 3`);
  console.log('\n🔑 Test Credentials:');
  console.log('   Admin: +2348012345678 / password123');
  console.log('   User: +2348023456789 / password123');
  console.log('   Rider: +2348078901234 / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });