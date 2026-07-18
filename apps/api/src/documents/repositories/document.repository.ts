import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Brackets } from 'typeorm';
import { Document } from '../entities/document.entity';
import {
  IDocumentRepository,
  PaginatedDocumentResult,
} from '../interfaces/document-repository.interface';

@Injectable()
export class DocumentRepository implements IDocumentRepository {
  constructor(
    @InjectRepository(Document)
    private readonly repo: Repository<Document>,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
    type?: string;
    status?: string;
    linkedEntityType?: string;
  }): Promise<PaginatedDocumentResult> {
    const { page, limit, search, type, status, linkedEntityType } = params;
    const qb = this.repo.createQueryBuilder('doc');

    if (search) {
      qb.where(
        new Brackets((qb) => {
          qb.where('doc.title ILIKE :search', { search: `%${search}%` })
            .orWhere('doc.documentNumber ILIKE :search', { search: `%${search}%` })
            .orWhere('doc.description ILIKE :search', { search: `%${search}%` });
        }),
      );
    }

    if (type) {
      qb.andWhere('doc.type = :type', { type });
    }

    if (status) {
      qb.andWhere('doc.status = :status', { status });
    }

    if (linkedEntityType) {
      qb.andWhere('doc.linkedEntityType = :linkedEntityType', { linkedEntityType });
    }

    qb.orderBy('doc.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Document | null> {
    return this.repo.findOne({
      where: { id },
      relations: { creator: true },
    });
  }

  async findByDocumentNumber(documentNumber: string): Promise<Document | null> {
    return this.repo.findOne({ where: { documentNumber } });
  }

  async create(data: Partial<Document>): Promise<Document> {
    const doc = this.repo.create(data);
    return this.repo.save(doc);
  }

  async update(id: string, data: Partial<Document>): Promise<Document> {
    await this.repo.update(id, data);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<Document> {
    await this.repo.restore(id);
    return this.repo.findOneOrFail({ where: { id } });
  }

  async findWithDeleted(id: string): Promise<Document | null> {
    return this.repo.findOne({ where: { id }, withDeleted: true });
  }

  async count(): Promise<number> {
    return this.repo.count();
  }
}
