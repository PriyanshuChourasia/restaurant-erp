import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RoleRepository } from './repositories/role.repository';
import { RolesService } from './services/roles.service';
import { RolesController } from './controllers/roles.controller';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Role]), PermissionsModule],
  controllers: [RolesController],
  providers: [RolesService, RoleRepository],
  exports: [RolesService, RoleRepository],
})
export class RolesModule {}
