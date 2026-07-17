import { Controller, Get, Param, Query } from '@nestjs/common';
import { DeveloperService } from './developer.service';

@Controller('developer')
export class DeveloperController {
  constructor(private readonly developerService: DeveloperService) {}

  @Get('tables')
  findAllTables() {
    return this.developerService.findAllTables();
  }

  @Get('tables/:tableName')
  findTableData(
    @Param('tableName') tableName: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const l = Math.min(parseInt(limit || '100', 10) || 100, 500);
    const o = parseInt(offset || '0', 10) || 0;
    return this.developerService.findTableData(tableName, l, o);
  }

  @Get('tables/:tableName/columns')
  findTableColumns(@Param('tableName') tableName: string) {
    return this.developerService.findTableColumns(tableName);
  }

  @Get('schema')
  findModuleSchema() {
    return this.developerService.findModuleSchema();
  }
}
