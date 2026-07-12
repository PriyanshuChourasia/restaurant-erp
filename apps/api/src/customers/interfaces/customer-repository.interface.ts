import { Customer } from '../entities/customer.entity';
import { QueryCustomerDto } from '../dto/query-customer.dto';

export interface PaginatedCustomerResult {
  items: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ICustomerRepository {
  findAll(query: QueryCustomerDto): Promise<PaginatedCustomerResult>;
  findById(id: string): Promise<Customer | null>;
  findByPhone(phone: string): Promise<Customer | null>;
  search(term: string, limit?: number): Promise<Pick<Customer, 'id' | 'name' | 'phone' | 'customerType' | 'priceLevelId'>[]>;
  create(data: Partial<Customer>): Promise<Customer>;
  update(id: string, data: Partial<Customer>): Promise<Customer>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
