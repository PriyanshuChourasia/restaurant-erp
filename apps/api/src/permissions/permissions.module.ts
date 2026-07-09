import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { PermissionRepository } from './repositories/permission.repository';
import { PermissionsService } from './services/permissions.service';
import { PermissionsController } from './controllers/permissions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionRepository],
  exports: [PermissionsService, PermissionRepository],
})
export class PermissionsModule {}
