export enum OrganizationRole {
  MAIN_ADMIN = 'MAIN_ADMIN', // 주관리자 (필수, 1명)
  SUB_ADMIN = 'SUB_ADMIN', // 부관리자 (여러명 가능)
  STUDENT = 'STUDENT', // 학생
  PARENT = 'PARENT', // 학부모
}
