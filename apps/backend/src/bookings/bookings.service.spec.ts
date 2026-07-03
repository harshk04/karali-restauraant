import { BookingsService } from "./bookings.service";

describe("BookingsService", () => {
  it("creates a booking reference", async () => {
    const bookingModel = {
      create: jest.fn(async (payload) => ({ _id: "booking-1", ...payload })),
      find: jest.fn(() => ({ sort: () => ({ lean: async () => [] }) })),
      findById: jest.fn(() => ({ lean: async () => null })),
      findOne: jest.fn(() => ({ lean: async () => null })),
    } as any;
    const slotsService = {
      slots: jest.fn(async () => ({ slots: [{ time: "19:30", available: true }] })),
    } as any;
    const notificationsService = {
      sendBookingNotification: jest.fn(async () => ({ status: "queued" })),
    } as any;

    const service = new BookingsService(bookingModel, slotsService, notificationsService);
    const booking = await service.create({ customerName: "Test", slotId: "2026-07-02-19:30", pax: 2 });

    expect(booking?.bookingId).toMatch(/^KR-/);
  });
});
