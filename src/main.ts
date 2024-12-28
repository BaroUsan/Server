import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('바로우산 API')
    .setDescription('바로우산은 부산소프트웨어마이스터고등학교 우산 대여 플랫폼입니다.')
    .setVersion('0.9')
    .addTag('인증/인가')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, document); 

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();