import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@karali.aero" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@karali.aero",
      phone: "+911111111111",
      password,
      role: "super_admin",
      status: "active",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@karali.aero" },
    update: {},
    create: {
      name: "David Jameson",
      email: "customer@karali.aero",
      phone: "+919999999999",
      password,
      role: "customer",
      status: "active",
    },
  });

  const table = await prisma.restaurantTable.upsert({
    where: { tableNumber: "T-04" },
    update: {},
    create: {
      tableNumber: "T-04",
      capacity: 4,
      status: "available",
      positionX: 38,
      positionY: 35,
    },
  });

  const slot = await prisma.slot.create({
    data: {
      date: new Date(),
      startTime: "19:30",
      endTime: "20:30",
      capacity: 16,
      status: "available",
    },
  });

  const booking = await prisma.booking.create({
    data: {
      bookingId: "KR-9284-LX",
      customerId: customer.id,
      tableId: table.id,
      slotId: slot.id,
      pax: 2,
      status: "confirmed",
      paymentStatus: "paid",
      qrCode: "encrypted-payload",
      payment: {
        create: {
          amount: 2400,
          status: "paid",
          razorpayPaymentId: "pay_demo_001",
        },
      },
      notifications: {
        create: [
          { type: "email", status: "sent", sentAt: new Date() },
          { type: "sms", status: "sent", sentAt: new Date() },
        ],
      },
    },
  });

  await prisma.checkin.upsert({
    where: { bookingId: booking.id },
    update: {},
    create: {
      bookingId: booking.id,
      staffId: admin.id,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
