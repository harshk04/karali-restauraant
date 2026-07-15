import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/http/global-exception.filter";
import { ApiResponseInterceptor } from "./common/http/api-response.interceptor";
import { RequestLoggingInterceptor } from "./common/http/request-logging.interceptor";

function validateStartupConfiguration() {
  const requiredInAllEnvironments = ["JWT_SECRET", "JWT_REFRESH_SECRET"];
  const missing = requiredInAllEnvironments.filter((key) => !process.env[key]?.trim());

  if (!process.env.MONGODB_URI?.trim() && !process.env.DATABASE_URL?.trim()) {
    missing.push("MONGODB_URI");
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (process.env.NODE_ENV === "production") {
    const unsafe = ["JWT_SECRET", "JWT_REFRESH_SECRET"].filter((key) =>
      (process.env[key] || "").includes("change-me"),
    );

    if (unsafe.length) {
      throw new Error(`Unsafe production secrets detected: ${unsafe.join(", ")}`);
    }
  }
}

async function bootstrap() {
  validateStartupConfiguration();

  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger("Bootstrap");

  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.enableShutdownHooks();
  app.setGlobalPrefix("api");
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor(), new ApiResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle("Karali API")
    .setDescription("Karali Restaurant Platform API")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, { useGlobalPrefix: true });

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  logger.log(`Karali backend listening on port ${port}`);
}

bootstrap();
