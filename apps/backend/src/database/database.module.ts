import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

@Global()
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("mongoUri") || configService.get<string>("databaseUrl") || "",
      }),
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
