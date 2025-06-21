export enum UserStatus {
  PENDING_PROFILE = 'PENDING_PROFILE', // 프로필 생성 필요
  ACTIVE = 'ACTIVE', // 활성 상태
  PENDING_STUDENT = 'PENDING_STUDENT', // 부모로 로그인했을 때 학생이 등록되지 않은 상태
  PENDING_PARENT = 'PENDING_PARENT', // 학생이 등록되었을 때 부모가 등록되지 않은 상태
}
