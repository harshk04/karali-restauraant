import { BookingsService } from "./bookings.service";

describe("BookingsService", () => {
  it("creates a booking reference", async () => {
    const bookingModel = {
      create: jest.fn(async (payload) => ({ _id: "booking-1", ...payload })),
      updateOne: jest.fn(async () => ({ acknowledged: true })),
      find: jest.fn(() => ({ sort: () => ({ lean: async () => [] }) })),
      findById: jest.fn(() => ({ lean: async () => null })),
      findOne: jest.fn(() => ({ lean: async () => null })),
    } as any;
    const slotOccupancyModel = {
      findOneAndUpdate: jest.fn(async () => ({ slotId: "2026-07-02-19:30" })),
    } as any;
    const slotsService = {
      slots: jest.fn(async () => ({ slots: [{ time: "19:30", available: true, maxBookingsPerSlot: 6 }] })),
    } as any;
    const notificationsService = {
      sendBookingNotification: jest.fn(async () => ({ status: "skipped", messageIds: [] })),
    } as any;

    const service = new BookingsService(bookingModel, slotOccupancyModel, slotsService, notificationsService);
    const booking = await service.create({ customerName: "Test", slotId: "2026-07-02-19:30", pax: 2 });

    expect(booking?.bookingId).toMatch(/^KR-/);
    expect(booking?.accessKey).toMatch(/^[a-f0-9]{48}$/);
    expect(notificationsService.sendBookingNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingId: booking?.bookingId,
        accessKey: booking?.accessKey,
      }),
    );
  });
});
