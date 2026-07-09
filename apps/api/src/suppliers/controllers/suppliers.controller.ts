import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Supplier } from '../entities/supplier.entity';

@Controller('suppliers')
export class SuppliersController {
  constructor(
    @InjectRepository(Supplier)
    private readonly repo: Repository<Supplier>,
  ) {}

  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    const where: any = { deletedAt: IsNull() };
    if (search) where.name = Like(`%${search}%`);
    const [data, total] = await this.repo.findAndCount({ where, skip: (page - 1) * limit, take: limit, order: { name: 'ASC' } });
    return { data, total, page, limit };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.repo.findOneOrFail({ where: { id } });
  }

  @Post()
  async create(@Body() dto: Partial<Supplier>) {
    return this.repo.save(this.repo.create(dto));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<Supplier>) {
    await this.repo.update(id, dto);
    return this.repo.findOneOrFail({ where: { id } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.repo.softDelete(id);
    return { message: 'Supplier deleted' };
  }
}
