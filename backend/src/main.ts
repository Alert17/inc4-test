import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Устанавливаем глобальный префикс для API
  app.setGlobalPrefix('api');

  // Настраиваем Swagger
  const config = new DocumentBuilder()
    .setTitle('Staking Rewards API')
    .setDescription('API для работы со стейкингом и статистикой')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Запуск приложения
  const port = 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
