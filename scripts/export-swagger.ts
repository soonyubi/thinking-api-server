import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

async function exportSwaggerJson() {
  try {
    // NestJS 애플리케이션 생성
    const app = await NestFactory.create(AppModule);

    // Swagger 설정
    const config = new DocumentBuilder()
      .setTitle('Thinking API Server')
      .setDescription('수업 관리 시스템 API 문서')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'JWT 토큰을 입력하세요',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', '인증 관련 API')
      .addTag('profiles', '프로필 관리 API')
      .addTag('organizations', '조직 관리 API')
      .addTag('courses', '수업 관리 API')
      .addTag('permissions', '권한 관리 API')
      .addTag('app', '애플리케이션 상태 확인')
      .build();

    // Swagger 문서 생성
    const document = SwaggerModule.createDocument(app, config);

    // JSON으로 변환
    const swaggerJson = JSON.stringify(document, null, 2);

    // 파일로 저장
    const outputPath = path.join(__dirname, '../swagger.json');
    fs.writeFileSync(outputPath, swaggerJson);

    console.log('✅ Swagger JSON이 성공적으로 export되었습니다!');
    console.log(`📁 파일 위치: ${outputPath}`);
    console.log('\n📋 Swagger Editor에서 사용하는 방법:');
    console.log('1. https://editor.swagger.io 접속');
    console.log('2. File > Import File에서 swagger.json 선택');
    console.log('3. 또는 아래 JSON을 복사해서 붙여넣기');
    console.log('\n' + '='.repeat(50));
    console.log('📄 Swagger JSON:');
    console.log('='.repeat(50));
    console.log(swaggerJson);
    console.log('='.repeat(50));

    await app.close();
  } catch (error) {
    console.error('❌ Swagger JSON export 실패:', error.message);
    process.exit(1);
  }
}

exportSwaggerJson();
