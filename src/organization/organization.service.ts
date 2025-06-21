import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { OrganizationRepository } from './repositories/organization.repository';
import { CreateOrganizationPayload } from './payload/create-organization.payload';
import { AddMemberPayload } from './payload/add-member.payload';
import { OrganizationRole } from 'src/common/enums/organization-role.enum';

@Injectable()
export class OrganizationService {
  constructor(private organizationRepository: OrganizationRepository) {}

  async createOrganization(
    createDto: CreateOrganizationPayload,
    creatorProfileId: number,
  ) {
    // 조직 생성자는 TEACHER 또는 ADMIN 역할이어야 함
    // 실제로는 ProfileRepository를 주입받아서 검증해야 함
    // 여기서는 간단히 처리

    // 조직 생성 시 주관리자로 자동 등록
    await this.organizationRepository.create({
      name: createDto.name,
      type: createDto.type,
      mainAdminProfileId: creatorProfileId,
    });

    // 생성된 조직을 찾아서 반환
    const organizations =
      await this.organizationRepository.findByMainAdminProfileId(
        creatorProfileId,
      );
    const createdOrg = organizations.find((org) => org.name === createDto.name);

    if (!createdOrg) {
      throw new Error('Failed to create organization');
    }

    // 주관리자 역할로 멤버 추가
    await this.organizationRepository.addMember({
      profileId: creatorProfileId,
      organizationId: createdOrg.id,
      roleInOrg: OrganizationRole.MAIN_ADMIN,
    });

    return this.organizationRepository.findById(createdOrg.id);
  }

  async getOrganizationById(organizationId: number) {
    const organization =
      await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  async getOrganizationsByMainAdmin(profileId: number) {
    return await this.organizationRepository.findByMainAdminProfileId(
      profileId,
    );
  }

  async getOrganizationsByProfile(profileId: number) {
    return await this.organizationRepository.findOrganizationsByProfileId(
      profileId,
    );
  }

  async getOrganizationMembers(organizationId: number) {
    await this.getOrganizationById(organizationId); // 조직 존재 확인
    return await this.organizationRepository.findMembersByOrganizationId(
      organizationId,
    );
  }

  async getOrganizationMembersByRole(
    organizationId: number,
    role: OrganizationRole,
  ) {
    await this.getOrganizationById(organizationId); // 조직 존재 확인
    return await this.organizationRepository.findMembersByRole(
      organizationId,
      role,
    );
  }

  async addMember(
    organizationId: number,
    addMemberDto: AddMemberPayload,
    requesterProfileId: number,
  ) {
    await this.getOrganizationById(organizationId);

    // 요청자가 주관리자 또는 부관리자인지 확인
    const requesterMember =
      await this.organizationRepository.findMemberByProfileAndOrg(
        requesterProfileId,
        organizationId,
      );

    if (!requesterMember) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    if (
      requesterMember.roleInOrg !== OrganizationRole.MAIN_ADMIN &&
      requesterMember.roleInOrg !== OrganizationRole.SUB_ADMIN
    ) {
      throw new ForbiddenException('Only admins can add members');
    }

    // 주관리자는 한 명만 있을 수 있음
    if (addMemberDto.roleInOrg === OrganizationRole.MAIN_ADMIN) {
      throw new BadRequestException(
        'Main admin already exists and cannot be changed',
      );
    }

    // 이미 멤버인지 확인
    const existingMember =
      await this.organizationRepository.findMemberByProfileAndOrg(
        addMemberDto.profileId,
        organizationId,
      );

    if (existingMember) {
      throw new ConflictException(
        'Profile is already a member of this organization',
      );
    }

    await this.organizationRepository.addMember({
      profileId: addMemberDto.profileId,
      organizationId,
      roleInOrg: addMemberDto.roleInOrg,
    });

    return this.organizationRepository.findMemberByProfileAndOrg(
      addMemberDto.profileId,
      organizationId,
    );
  }

  async updateMemberRole(
    organizationId: number,
    profileId: number,
    newRole: OrganizationRole,
    requesterProfileId: number,
  ) {
    await this.getOrganizationById(organizationId);

    // 요청자가 주관리자인지 확인
    const requesterMember =
      await this.organizationRepository.findMemberByProfileAndOrg(
        requesterProfileId,
        organizationId,
      );

    if (
      !requesterMember ||
      requesterMember.roleInOrg !== OrganizationRole.MAIN_ADMIN
    ) {
      throw new ForbiddenException('Only main admin can update member roles');
    }

    // 주관리자 역할 변경은 불가능
    if (newRole === OrganizationRole.MAIN_ADMIN) {
      throw new BadRequestException(
        'Main admin role cannot be assigned to other members',
      );
    }

    // 대상 멤버가 존재하는지 확인
    const targetMember =
      await this.organizationRepository.findMemberByProfileAndOrg(
        profileId,
        organizationId,
      );

    if (!targetMember) {
      throw new NotFoundException('Member not found in organization');
    }

    // 주관리자를 다른 역할로 변경하려고 하는 경우
    if (targetMember.roleInOrg === OrganizationRole.MAIN_ADMIN) {
      throw new BadRequestException('Main admin role cannot be changed');
    }

    await this.organizationRepository.updateMemberRole(
      profileId,
      organizationId,
      newRole,
    );

    return this.organizationRepository.findMemberByProfileAndOrg(
      profileId,
      organizationId,
    );
  }

  async removeMember(
    organizationId: number,
    profileId: number,
    requesterProfileId: number,
  ) {
    await this.getOrganizationById(organizationId);

    // 요청자가 주관리자인지 확인
    const requesterMember =
      await this.organizationRepository.findMemberByProfileAndOrg(
        requesterProfileId,
        organizationId,
      );

    if (
      !requesterMember ||
      requesterMember.roleInOrg !== OrganizationRole.MAIN_ADMIN
    ) {
      throw new ForbiddenException('Only main admin can remove members');
    }

    // 대상 멤버가 존재하는지 확인
    const targetMember =
      await this.organizationRepository.findMemberByProfileAndOrg(
        profileId,
        organizationId,
      );

    if (!targetMember) {
      throw new NotFoundException('Member not found in organization');
    }

    // 주관리자는 제거할 수 없음
    if (targetMember.roleInOrg === OrganizationRole.MAIN_ADMIN) {
      throw new BadRequestException('Main admin cannot be removed');
    }

    await this.organizationRepository.removeMember(profileId, organizationId);

    return { message: 'Member removed successfully' };
  }

  async checkMemberPermission(
    organizationId: number,
    profileId: number,
    requiredRoles: OrganizationRole[],
  ): Promise<boolean> {
    const member = await this.organizationRepository.findMemberByProfileAndOrg(
      profileId,
      organizationId,
    );

    if (!member) {
      return false;
    }

    return requiredRoles.includes(member.roleInOrg as OrganizationRole);
  }
}
