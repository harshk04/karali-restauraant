import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { Model } from "mongoose";
import bcrypt from "bcryptjs";
import { Booking, BookingDocument } from "../database/schemas/booking.schema";
import { Checkin, CheckinDocument } from "../database/schemas/checkin.schema";
import { AuditLog, AuditLogDocument } from "../database/schemas/audit-log.schema";
import { Staff, StaffDocument } from "../database/schemas/staff.schema";
import type { StaffSession } from "./staff.guard";

type CreateStaffDto = {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
  mobile?: string;
  email?: string;
  designation?: string;
  status?: "active" | "inactive";
};

type UpdateStaffDto = {
  name?: string;
  username?: string;
  mobile?: string;
  email?: string;
  designation?: string;
  status?: "active" | "inactive";
};

type ResetPasswordDto = {
  newPassword: string;
  confirmPassword: string;
};

type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type StaffLoginResult = {
  token: string;
  session: StaffSession;
};

type CheckinResponse = {
  bookingId: string;
  customerName: string;
  phone: string;
  email: string;
  pax: number;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
  checkedInAt: string;
  checkedInByStaffId: string;
  tableNumber: string;
};

function stripHash(staff: StaffDocument | Record<string, unknown>) {
  const source = staff as StaffDocument & { toObject?: unknown };
  const plain =
    typeof source.toObject === "function"
      ? source.toObject()
      : { ...(staff as Record<string, unknown>) };
  const result = { ...plain } as Record<string, unknown>;
  delete result.passwordHash;
  return result;
}

function isDuplicateUsernameError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000 &&
      "keyValue" in error &&
      typeof (error as { keyValue?: Record<string, unknown> }).keyValue?.username === "string",
  );
}

@Injectable()
export class StaffService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Staff.name) private readonly staffModel: Model<StaffDocument>,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Checkin.name) private readonly checkinModel: Model<CheckinDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  private signSession(staff: StaffDocument): StaffLoginResult {
    const session: StaffSession = {
      id: String(staff._id),
      name: staff.name,
      username: staff.username,
      mobile: staff.mobile || "",
      email: staff.email || "",
      designation: staff.designation || "",
      role: "staff",
      status: staff.status,
    };

    const token = this.jwtService.sign(session, {
      secret: process.env.JWT_SECRET || "change-me",
      expiresIn: "1d",
    });

    return { token, session };
  }

  async logAction(
    actorId: string,
    action: string,
    metadata: Record<string, unknown> = {},
    actorRole = "staff",
    targetId = "",
  ) {
    await this.auditLogModel.create({
      actorId,
      actorRole,
      action,
      targetId,
      metadata,
    });
  }

  async login(username: string, password: string): Promise<StaffLoginResult | null> {
    const normalizedUsername = String(username || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");
    const staff = await this.staffModel.findOne({
      username: normalizedUsername,
      deletedAt: null,
    });

    if (!staff || staff.status !== "active") {
      return null;
    }

    const matches = await bcrypt.compare(normalizedPassword, staff.passwordHash);
    if (!matches) {
      return null;
    }

    staff.lastLogin = new Date();
    await staff.save();
    await this.logAction(String(staff._id), "staff.login", { username: staff.username }, "staff", String(staff._id));
    return this.signSession(staff);
  }

  async me(session: StaffSession | undefined) {
    if (!session?.id) {
      return null;
    }

    const staff = await this.staffModel.findById(session.id).lean();
    if (!staff || staff.deletedAt) {
      return null;
    }

    return stripHash(staff);
  }

  async dashboard() {
    const today = new Date().toISOString().slice(0, 10);
    const [bookings, checkins] = await Promise.all([
      this.bookingModel.find({ date: today }).lean(),
      this.checkinModel.find({
        checkedInAt: {
          $gte: new Date(`${today}T00:00:00.000Z`),
          $lt: new Date(`${today}T23:59:59.999Z`),
        },
      }).lean(),
    ]);

    const todaysReservations = bookings.length;
    const todaysCheckins = checkins.length;
    const pendingCheckins = bookings.filter((booking) => booking.status === "pending" || booking.status === "confirmed").length;
    const walkInsToday = bookings.filter((booking) => booking.source === "manual").length;

    const recentCheckins = await this.checkinModel
      .find({
        checkedInAt: {
          $gte: new Date(`${today}T00:00:00.000Z`),
        },
      })
      .sort({ checkedInAt: -1 })
      .limit(8)
      .lean();

    const recentBookings = bookings
      .sort((left, right) => right.time.localeCompare(left.time))
      .slice(0, 8)
      .map((booking) => ({
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        time: booking.time,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      }));

    return {
      todaysReservations,
      todaysCheckins,
      pendingCheckins,
      walkInsToday,
      recentCheckins,
      recentBookings,
    };
  }

  async listCheckins(query: {
    search?: string;
    date?: string;
    page?: number;
    limit?: number;
    sort?: "asc" | "desc";
  }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const date = query.date || new Date().toISOString().slice(0, 10);
    const sortDirection = query.sort === "asc" ? 1 : -1;

    const filter: Record<string, unknown> = {
      checkedInAt: {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lt: new Date(`${date}T23:59:59.999Z`),
      },
    };

    const checkins = await this.checkinModel.find(filter).sort({ checkedInAt: sortDirection }).lean();
    const bookings = await this.bookingModel.find({
      date,
      ...(query.search
        ? {
            $or: [
              { bookingId: { $regex: query.search, $options: "i" } },
              { customerName: { $regex: query.search, $options: "i" } },
              { phone: { $regex: query.search, $options: "i" } },
            ],
          }
        : {}),
    }).lean();
    const bookingMap = new Map(bookings.map((booking) => [booking.bookingId, booking]));
    const staffIds = [...new Set(checkins.map((item) => item.checkedInByStaffId || item.staffId).filter(Boolean))];
    const staffMembers = await this.staffModel.find({ _id: { $in: staffIds } }).lean();
    const staffMap = new Map(staffMembers.map((staff) => [String(staff._id), staff]));

    const records = checkins
      .map((item) => {
        const booking = bookingMap.get(item.bookingId);
        if (!booking) return null;
        const staff = staffMap.get(item.checkedInByStaffId || item.staffId);
        return {
          bookingId: booking.bookingId,
          customerName: booking.customerName,
          phone: booking.phone,
          pax: booking.pax,
          tableNumber: booking.slotId?.split("-").pop() || "",
          checkedInBy: staff?.name || "System",
          status: booking.status,
          checkedInAt: item.checkedInAt,
          time: booking.time,
        };
      })
      .filter(Boolean) as Array<{
      bookingId: string;
      customerName: string;
      phone: string;
      pax: number;
      tableNumber: string;
      checkedInBy: string;
      status: string;
      checkedInAt: Date | null;
      time: string;
    }>;

    const total = records.length;
    const start = (page - 1) * limit;
    return {
      items: records.slice(start, start + limit),
      total,
      page,
      limit,
    };
  }

  async getProfile(session: StaffSession) {
    const staff = await this.staffModel.findById(session.id).lean();
    if (!staff || staff.deletedAt) {
      throw new NotFoundException("Staff account not found.");
    }
    return stripHash(staff);
  }

  async changePassword(session: StaffSession, payload: ChangePasswordDto) {
    if (payload.newPassword !== payload.confirmPassword) {
      throw new BadRequestException("Passwords do not match.");
    }
    if (payload.newPassword.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters long.");
    }

    const staff = await this.staffModel.findById(session.id);
    if (!staff || staff.deletedAt) {
      throw new NotFoundException("Staff account not found.");
    }

    const currentMatches = await bcrypt.compare(payload.currentPassword, staff.passwordHash);
    if (!currentMatches) {
      throw new UnauthorizedException("Current password is incorrect.");
    }

    staff.passwordHash = await bcrypt.hash(payload.newPassword, 10);
    await staff.save();
    await this.logAction(String(staff._id), "staff.password_changed", {}, "staff", String(staff._id));
    return { success: true };
  }

  async validateBooking(bookingId: string) {
    const booking = await this.bookingModel.findOne({ bookingId }).lean();
    if (!booking) {
      return { valid: false, reason: "invalid" as const };
    }

    const today = new Date().toISOString().slice(0, 10);
    if (booking.status === "cancelled") {
      return { valid: false, reason: "cancelled" as const, booking };
    }
    if (booking.status === "checked_in" || booking.checkedInAt) {
      return { valid: false, reason: "already_used" as const, booking };
    }
    if (booking.date < today) {
      return { valid: false, reason: "expired" as const, booking };
    }

    return {
      valid: true as const,
      booking: {
        bookingId: booking.bookingId,
        customerName: booking.customerName,
        phone: booking.phone,
        email: booking.email,
        pax: booking.pax,
        date: booking.date,
        time: booking.time,
        tableNumber: booking.slotId?.split("-").pop() || "",
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      },
    };
  }

  async checkInBooking(bookingId: string, staff: StaffSession) {
    const validation = await this.validateBooking(bookingId);
    if (!validation.valid || !validation.booking) {
      throw new BadRequestException(validation.reason);
    }
    const booking = validation.booking as {
      bookingId: string;
      customerName: string;
      phone: string;
      email: string;
      pax: number;
      date: string;
      time: string;
      tableNumber: string;
      status: string;
      paymentStatus: string;
    };
    const tableNumber = booking.tableNumber || "";

    const now = new Date();
    const updated = await this.bookingModel.findOneAndUpdate(
      { bookingId, status: { $ne: "checked_in" } },
      {
        $set: {
          status: "checked_in",
          checkedInAt: now,
          checkedInByStaffId: staff.id,
        },
      },
      { new: true },
    );

    if (!updated) {
      throw new ConflictException("Booking is already checked in.");
    }

    await this.checkinModel.updateOne(
      { bookingId },
      {
        $set: {
          bookingId,
          staffId: staff.id,
          checkedInByStaffId: staff.id,
          status: "checked_in",
          checkedInAt: now,
        },
      },
      { upsert: true },
    );

    await this.logAction(staff.id, "staff.check_in", { bookingId }, "staff", bookingId);

    return {
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      phone: booking.phone,
      email: booking.email,
      pax: booking.pax,
      date: booking.date,
      time: booking.time,
      status: "checked_in",
      paymentStatus: booking.paymentStatus,
      checkedInAt: now.toISOString(),
      checkedInByStaffId: staff.id,
      tableNumber,
    } satisfies CheckinResponse;
  }

  async listStaff(search?: string) {
    const needle = String(search || "").trim();
    const filter: Record<string, unknown> = { deletedAt: null };
    if (needle) {
      filter.$or = [
        { name: { $regex: needle, $options: "i" } },
        { username: { $regex: needle, $options: "i" } },
        { mobile: { $regex: needle, $options: "i" } },
        { email: { $regex: needle, $options: "i" } },
        { designation: { $regex: needle, $options: "i" } },
      ];
    }
    const staff = await this.staffModel.find(filter).sort({ createdAt: -1 }).lean();
    return staff.map(stripHash);
  }

  async getStaff(id: string) {
    const staff = await this.staffModel.findById(id).lean();
    if (!staff || staff.deletedAt) {
      throw new NotFoundException("Staff not found.");
    }
    return stripHash(staff);
  }

  async createStaff(payload: CreateStaffDto) {
    const username = String(payload.username || "").trim().toLowerCase();
    const password = String(payload.password || "");
    const confirmPassword = String(payload.confirmPassword || "");
    if (!username) throw new BadRequestException("Username is required.");
    if (password.length < 8) throw new BadRequestException("Password must be at least 8 characters long.");
    if (password !== confirmPassword) throw new BadRequestException("Passwords do not match.");

    const existing = await this.staffModel.findOne({ username, deletedAt: null }).lean();
    if (existing) {
      throw new ConflictException("Username already exists.");
    }

    try {
      const staff = await this.staffModel.create({
        name: String(payload.name || "").trim(),
        username,
        passwordHash: await bcrypt.hash(password, 10),
        mobile: String(payload.mobile || "").trim(),
        email: String(payload.email || "").trim(),
        designation: String(payload.designation || "").trim(),
        role: "staff",
        status: payload.status === "inactive" ? "inactive" : "active",
        deletedAt: null,
      });

      await this.logAction("admin", "staff.create", { username }, "admin", String(staff._id));
      return stripHash(staff);
    } catch (error) {
      if (isDuplicateUsernameError(error)) {
        throw new ConflictException("Username already exists.");
      }
      throw error;
    }
  }

  async updateStaff(id: string, payload: UpdateStaffDto) {
    const staff = await this.staffModel.findById(id);
    if (!staff || staff.deletedAt) {
      throw new NotFoundException("Staff not found.");
    }

    if (payload.username && payload.username.trim().toLowerCase() !== staff.username) {
      const existing = await this.staffModel.findOne({
        username: payload.username.trim().toLowerCase(),
        _id: { $ne: id },
        deletedAt: null,
      }).lean();
      if (existing) {
        throw new ConflictException("Username already exists.");
      }
      staff.username = payload.username.trim().toLowerCase();
    }

    if (payload.name !== undefined) staff.name = payload.name.trim();
    if (payload.mobile !== undefined) staff.mobile = payload.mobile.trim();
    if (payload.email !== undefined) staff.email = payload.email.trim();
    if (payload.designation !== undefined) staff.designation = payload.designation.trim();
    if (payload.status) staff.status = payload.status;

    try {
      await staff.save();
      await this.logAction("admin", "staff.update", { staffId: id }, "admin", id);
      return stripHash(staff);
    } catch (error) {
      if (isDuplicateUsernameError(error)) {
        throw new ConflictException("Username already exists.");
      }
      throw error;
    }
  }

  async setStatus(id: string, status: "active" | "inactive") {
    return this.updateStaff(id, { status });
  }

  async deleteStaff(id: string) {
    const staff = await this.staffModel.findById(id);
    if (!staff || staff.deletedAt) {
      throw new NotFoundException("Staff not found.");
    }
    staff.status = "inactive";
    staff.deletedAt = new Date();
    await staff.save();
    await this.logAction("admin", "staff.delete", { staffId: id }, "admin", id);
    return { success: true };
  }

  async resetPassword(id: string, payload: ResetPasswordDto) {
    const staff = await this.staffModel.findById(id);
    if (!staff || staff.deletedAt) {
      throw new NotFoundException("Staff not found.");
    }
    if (payload.newPassword !== payload.confirmPassword) {
      throw new BadRequestException("Passwords do not match.");
    }
    if (payload.newPassword.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters long.");
    }
    staff.passwordHash = await bcrypt.hash(payload.newPassword, 10);
    await staff.save();
    await this.logAction("admin", "staff.reset_password", { staffId: id }, "admin", id);
    return { success: true };
  }
}
