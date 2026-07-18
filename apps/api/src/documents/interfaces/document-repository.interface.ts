import type { Document } from '../entities/document.entity';

export interface PaginatedDocumentResult {
  items: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IDocumentRepository {
  findAll(params: {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    status?: string;
    linkedEntityType?: string;
  }): Promise<PaginatedDocumentResult>;
  findById(id: string): Promise<Document | null>;
  findByDocumentNumber(documentNumber: string): Promise<Document | null>;
  create(data: Partial<Document>): Promise<Document>;
  update(id: string, data: Partial<Document>): Promise<Document>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<Document>;
  findWithDeleted(id: string): Promise<Document | null>;
  count(): Promise<number>;
}
