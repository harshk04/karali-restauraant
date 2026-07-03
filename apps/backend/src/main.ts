import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true, rawBody: true });
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.setGlobalPrefix("api");
  app.use(helmet());
  app.use(cookieParser());
  app.use(morgan("combined"));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle("Karali API")
    .setDescription("Karali Restaurant Platform API")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document, { useGlobalPrefix: true });

  const requiredEnv = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"];
  const missing = requiredEnv.filter((key) => !process.env[key] || process.env[key]?.includes("replace-with"));
  if (missing.length && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required payment env vars: ${missing.join(", ")}`);
  }

  if (missing.length) {
    console.warn(`Running without live Razorpay credentials: ${missing.join(", ")}`);
  }

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
}

bootstrap();
