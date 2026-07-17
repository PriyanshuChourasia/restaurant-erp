import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from '../entities/unit.entity';

@Controller('stock-items')
export class StockController {
  constructor(
    @InjectRepository(Unit)
    private readonly repo: Repository<Unit>,
  ) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('group') group?: string,
    @Query('category') category?: string,
  ) {
    const qb = this.repo.createQueryBuilder('unit')
      .leftJoinAndSelect('unit.stockGroup', 'stockGroup')
      .leftJoinAndSelect('unit.stockCategory', 'stockCategory')
      .leftJoinAndSelect('unit.unitOfMeasure', 'uom')
      .where('unit.isActive = :active', { active: true });

    if (search) {
      qb.andWhere('(unit.name ILIKE :search OR unit.code ILIKE :search OR unit.alias ILIKE :search)', { search: `%${search}%` });
    }

    if (group) {
      qb.andWhere('stockGroup.code = :group', { group });
    }

    if (category) {
      qb.andWhere('stockCategory.id = :category', { category });
    }

    const take = Math.min(Math.max(parseInt(limit || '20', 10) || 20, 1), 100);
    const skip = (Math.max(parseInt(page || '1', 10) || 1, 1) - 1) * take;

    qb.skip(skip).take(take).orderBy('unit.name', 'ASC');

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page: Math.floor(skip / take) + 1, limit: take };
  }
}
