# Thinking API Server

수업 관리 시스템을 위한 NestJS 기반 API 서버입니다.

## 🚀 기술 스택

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: MySQL 8.0
- **ORM**: Drizzle ORM
- **Authentication**: JWT (Passport)
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Package Manager**: Yarn

## 📋 목차

- [설치 및 실행](#설치-및-실행)
- [데이터베이스 설정](#데이터베이스-설정)
- [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
- [테스트 실행](#테스트-실행)
- [API 문서 확인](#api-문서-확인)
- [개발 환경 설정](#개발-환경-설정)

## 🛠 설치 및 실행

### 1. 의존성 설치

```bash
yarn install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수들을 설정하세요:

```env
# Database
DATABASE_URL=mysql://username:password@localhost:3306/database_name
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=your_database_name
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key

# Redis (선택사항)
REDIS_URL=redis://localhost:6379
```

### 3. 애플리케이션 실행

```bash
# 개발 모드 (핫 리로드)
yarn start:dev

# 프로덕션 모드
yarn start:prod

# 디버그 모드
yarn start:debug
```

서버가 성공적으로 시작되면 `http://localhost:3000`에서 접근할 수 있습니다.

## 🗄 데이터베이스 설정

### Docker Compose를 사용한 MySQL 실행

```bash
# MySQL 서버 시작
docker-compose up -d mysql

# MySQL 서버 중지
docker-compose down
```

### 수동 MySQL 설정

MySQL 8.0을 직접 설치하고 데이터베이스를 생성한 후, `.env` 파일의 `DATABASE_URL`을 설정하세요.

## 🔄 데이터베이스 마이그레이션

### 스키마 변경사항 적용

```bash
# 데이터베이스에 스키마 변경사항 푸시
yarn db:push

# 마이그레이션 파일 생성
yarn db:generate

# 마이그레이션 실행
yarn db:migrate
```

### 마이그레이션 파일 위치

마이그레이션 파일들은 `drizzle/` 디렉토리에 생성됩니다.

## 🧪 테스트 실행

### 단위 테스트

```bash
# 모든 테스트 실행
yarn test

# 테스트 감시 모드
yarn test:watch

# 테스트 커버리지 확인
yarn test:cov

# 디버그 모드로 테스트 실행
yarn test:debug
```

### E2E 테스트

```bash
# E2E 테스트 실행
yarn test:e2e

# 통합 테스트만 실행
yarn test:e2e:integration
```

### 테스트 데이터베이스 설정

E2E 테스트를 위해 별도의 테스트용 MySQL 컨테이너가 제공됩니다:

```bash
# 테스트용 MySQL 시작
docker-compose up -d test-mysql
```

테스트용 데이터베이스는 `localhost:3307`에서 실행됩니다.

## 📚 API 문서 확인

### Swagger UI 접근

애플리케이션이 실행된 후 다음 URL에서 API 문서를 확인할 수 있습니다:

```
http://localhost:3000/api
```

### Swagger JSON 내보내기

```bash
# Swagger JSON 파일 생성
yarn swagger:export

# 간단한 Swagger JSON 파일 생성
yarn swagger:export-simple
```

생성된 `swagger.json` 파일을 Swagger Editor나 다른 도구에서 사용할 수 있습니다.

## 🔧 개발 환경 설정

### 코드 포맷팅

```bash
# 코드 포맷팅
yarn format

# 린팅 및 자동 수정
yarn lint
```

### 빌드

```bash
# 프로덕션 빌드
yarn build
```

## 📁 프로젝트 구조

```
src/
├── auth/           # 인증 관련 모듈
├── common/         # 공통 유틸리티
├── course/         # 수업 관리 모듈
├── db/            # 데이터베이스 스키마 및 설정
├── organization/  # 조직 관리 모듈
├── permission/    # 권한 관리 모듈
├── profile/       # 프로필 관리 모듈
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts

test/
├── auth/          # 인증 테스트
├── course/        # 수업 테스트
├── organization/  # 조직 테스트
├── permission/    # 권한 테스트
├── profile/       # 프로필 테스트
└── helpers/       # 테스트 헬퍼
```

## 🔐 인증

이 API는 JWT 기반 인증을 사용합니다. 보호된 엔드포인트에 접근하려면:

1. `/auth/login` 엔드포인트로 로그인하여 JWT 토큰을 받으세요
2. 받은 토큰을 `Authorization: Bearer <token>` 헤더에 포함하여 요청하세요

## 🐛 문제 해결

### 일반적인 문제들

1. **데이터베이스 연결 실패**

   - MySQL 서버가 실행 중인지 확인
   - `.env` 파일의 `DATABASE_URL` 설정 확인
   - Docker 컨테이너 상태 확인: `docker-compose ps`

2. **포트 충돌**

   - 3000번 포트가 사용 중인 경우 다른 포트로 변경
   - `src/main.ts`에서 포트 설정 수정

3. **마이그레이션 실패**
   - 데이터베이스 연결 상태 확인
   - 기존 마이그레이션 파일과 스키마 불일치 확인

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해 주세요.
