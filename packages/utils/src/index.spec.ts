import { makeBookingRef } from "./index";

describe("makeBookingRef", () => {
  it("pads booking references", () => {
    expect(makeBookingRef(42)).toBe("KR-0042");
  });
});
