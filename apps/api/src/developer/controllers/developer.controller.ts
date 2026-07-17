import { Controller, Get, Post, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { DeveloperService } from '../services/developer.service';

@Controller('developer')
export class DeveloperController {
  constructor(private readonly developerService: DeveloperService) {}

  @Get('db-info')
  async getDbInfo() {
    return this.developerService.getDbInfo();
  }

  @Get('tables')
  async getTableStats() {
    return this.developerService.getTableStats();
  }

  @Get('tables/:tableName')
  async getTableData(
    @Param('tableName') tableName: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = Math.min(parseInt(limit || '100', 10), 500);
    const off = parseInt(offset || '0', 10) || 0;
    return this.developerService.getTableData(tableName, lim, off);
  }

  @Get('tables/:tableName/columns')
  async getTableColumns(@Param('tableName') tableName: string) {
    return this.developerService.getTableColumns(tableName);
  }

  @Get('schema')
  async getModuleSchema() {
    return this.developerService.getModuleSchema();
  }

  @Post('backup')
  async createBackup() {
    try {
      return await this.developerService.createBackup();
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('backups')
  async listBackups() {
    return this.developerService.listBackups();
  }

  @Post('restore/:filename')
  async restoreBackup(@Param('filename') filename: string) {
    try {
      return await this.developerService.restoreBackup(filename);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('create-database')
  async createDatabase(@Body() body: { name: string }) {
    if (!body.name) {
      throw new HttpException('Database name is required', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.developerService.createDatabase(body.name);
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
