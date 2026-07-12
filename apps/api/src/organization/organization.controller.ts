import { Controller, Get, Put, Body, ValidationPipe } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Permissions } from '../shared/decorators/permissions.decorator';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get()
  getSettings() {
    return this.orgService.getSettings();
  }

  @Put()
  @Permissions('settings.update')
  update(@Body(new ValidationPipe({ transform: true })) dto: UpdateOrganizationDto) {
    return this.orgService.update(dto);
  }
}
