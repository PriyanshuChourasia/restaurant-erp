import { Controller, Get, Post, Body, Query, ValidationPipe, BadRequestException, NotFoundException } from '@nestjs/common';
import { UnitsService } from '../services/units.service';
import { ConvertUnitsDto } from '../dto/convert-units.dto';
import { FormatQuantityDto, FormatQuantityBatchDto } from '../dto/format-quantity.dto';

@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.unitsService.findAll(includeInactive === 'true');
  }

  @Get('convert')
  async convert(@Query(new ValidationPipe({ transform: true })) query: ConvertUnitsDto) {
    const { quantity, from, to, itemId } = query;

    // Resolve 'from' and 'to' by code if they are not UUIDs
    const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

    const resolveUnit = async (idOrCode: string): Promise<string> => {
      if (isUuid(idOrCode)) return idOrCode;
      const unit = await this.unitsService.findByCode(idOrCode);
      if (!unit) throw new NotFoundException(`Unit with code "${idOrCode}" not found`);
      return unit.id;
    };

    const fromId = await resolveUnit(from);
    const toId = await resolveUnit(to);

    const result = await this.unitsService.convert(quantity, fromId, toId, itemId);
    return { quantity, from, to, result };
  }

  // ── Multi-unit formatting endpoints ─────────────────────────

  /**
   * Format a single quantity into human-readable multi-unit format.
   * GET /units/format?quantity=3400&unit=gram
   * Returns: { quantity: 3400, unit: 'gram', formatted: '3 kg 400 g'
   *           compact: '3.4 kg', numeric: { value: 3.4, unit: 'kg' } }
   */
  @Get('format')
  formatSingle(@Query(new ValidationPipe({ transform: true })) query: FormatQuantityDto) {
    const { quantity, unit, variant } = query;

    if (variant === 'compact') {
      return {
        quantity,
        unit,
        formatted: this.unitsService.compactQuantity(quantity, unit),
      };
    }

    if (variant === 'numeric') {
      const { value, unit: numericUnit } = this.unitsService.toLargerUnit(quantity, unit);
      return { quantity, unit, numericValue: value, numericUnit };
    }

    const numericResult = this.unitsService.toLargerUnit(quantity, unit);
    return {
      quantity,
      unit,
      formatted: this.unitsService.formatQuantity(quantity, unit),
      compact: this.unitsService.compactQuantity(quantity, unit),
      numeric: numericResult,
    };
  }

  /**
   * Format multiple quantities in batch.
   * POST /units/format-batch
   * Body: { variant: 'full', items: [{ quantity: 3400, unit: 'gram' }, ...] }
   */
  @Post('format-batch')
  formatBatch(@Body(new ValidationPipe({ transform: true })) body: FormatQuantityBatchDto) {
    const result = this.unitsService.formatQuantityBatch(body.items, body.variant || 'full');
    return { items: result };
  }
}
