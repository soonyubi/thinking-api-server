const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function exportSwaggerJson() {
  try {
    console.log('🚀 서버를 시작하고 Swagger JSON을 가져오는 중...');

    // 서버가 실행 중인지 확인하고 Swagger JSON 가져오기
    const response = await axios.get('http://localhost:3000/api-json');

    const swaggerJson = JSON.stringify(response.data, null, 2);

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
  } catch (error) {
    console.error('❌ Swagger JSON export 실패:', error.message);
    console.log('\n💡 해결 방법:');
    console.log('1. yarn start:dev 명령으로 서버를 먼저 실행하세요');
    console.log('2. 서버가 실행된 후 다시 이 스크립트를 실행하세요');
    process.exit(1);
  }
}

exportSwaggerJson();
