import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS
  app.enableCors({
    // 1) Restrict the allowed origin(s) to your front-end
    origin: "http://localhost:3000",
    
    // 2) Allowed request methods
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    // 3) Allowed headers
    allowedHeaders: ["Content-Type", "Authorization"],

    // 4) If you need cookies or credentials, set this
    // credentials: true,
  });
  await app.listen(3000);
}
bootstrap();
