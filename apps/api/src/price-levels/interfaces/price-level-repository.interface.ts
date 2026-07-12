import { PriceLevel } from '../entities/price-level.entity';
import { QueryPriceLevelDto } from '../dto/query-price-level.dto';

export interface PaginatedPriceLevelResult {
  items: PriceLevel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IPriceLevelRepository {
  findAll(query: QueryPriceLevelDto): Promise<PaginatedPriceLevelResult>;
  findById(id: string): Promise<PriceLevel | null>;
  findByCode(code: string): Promise<PriceLevel | null>;
  findDefault(): Promise<PriceLevel | null>;
  findAllActive(): Promise<PriceLevel[]>;
  create(data: Partial<PriceLevel>): Promise<PriceLevel>;
  update(id: string, data: Partial<PriceLevel>): Promise<PriceLevel>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
