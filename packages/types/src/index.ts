export type Role =
  | "customer"
  | "reception_staff"
  | "manager"
  | "admin"
  | "super_admin";

export type UserStatus = "active" | "inactive" | "suspended";
export type BookingStatus = "pending" | "confirmed" | "checked_in" | "cancelled" | "no_show";
export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded";
export type SlotStatus = "available" | "limited" | "sold_out" | "closed";

export interface BookingSummary {
  id: string;
  bookingId: string;
  customerName: string;
  date: string;
  time: string;
  pax: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  qrCode?: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: SlotStatus;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entity: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
