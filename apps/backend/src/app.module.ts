import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { appConfig } from "./config";
import { AuthModule } from "./auth/auth.module";
import { BookingsModule } from "./bookings/bookings.module";
import { CheckinsModule } from "./checkins/checkins.module";
import { DatabaseModule } from "./database/database.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PaymentsModule } from "./payments/payments.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { CustomersModule } from "./customers/customers.module";
import { AdminModule } from "./admin/admin.module";
import { QrModule } from "./qr/qr.module";
import { ReportsModule } from "./reports/reports.module";
import { SlotsModule } from "./slots/slots.module";
import { UploadsModule } from "./uploads/uploads.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    BookingsModule,
    SlotsModule,
    QrModule,
    CheckinsModule,
    NotificationsModule,
    PaymentsModule,
    AdminModule,
    ReportsModule,
    CustomersModule,
    AnalyticsModule,
    UploadsModule,
  ],
})
export class AppModule {}
