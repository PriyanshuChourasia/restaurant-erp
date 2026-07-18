import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentRepository } from '../repositories/document.repository';
import { DocumentLink } from '../entities/document-link.entity';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { QueryDocumentDto } from '../dto/query-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    @InjectRepository(DocumentLink)
    private readonly linkRepository: Repository<DocumentLink>,
  ) {}

  async findAll(query: QueryDocumentDto) {
    return this.documentRepository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      type: query.type,
      status: query.status,
      linkedEntityType: query.linkedEntityType,
    });
  }

  async findOne(id: string) {
    const doc = await this.documentRepository.findById(id);
    if (!doc) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }
    return doc;
  }

  async findByEntity(entityType: string, entityId: string) {
    const links = await this.linkRepository.find({
      where: { entityType, entityId },
      relations: { document: true },
      order: { createdAt: 'DESC' },
    });
    return links.map((link) => link.document);
  }

  async create(dto: CreateDocumentDto, userId?: string) {
    const documentNumber = await this.generateDocumentNumber();

    const doc = await this.documentRepository.create({
      ...dto,
      documentNumber,
      createdBy: userId || null,
    });

    return doc;
  }

  async uploadFile(
    file: Express.Multer.File,
    dto: CreateDocumentDto,
    userId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const documentNumber = await this.generateDocumentNumber();

    const doc = await this.documentRepository.create({
      ...dto,
      documentNumber,
      fileName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
      createdBy: userId || null,
    });

    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    const doc = await this.documentRepository.findById(id);
    if (!doc) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }

    return this.documentRepository.update(id, dto);
  }

  async remove(id: string) {
    const doc = await this.documentRepository.findById(id);
    if (!doc) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }
    await this.documentRepository.softDelete(id);
  }

  async restore(id: string) {
    const doc = await this.documentRepository.findWithDeleted(id);
    if (!doc) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }
    if (!doc.deletedAt) {
      throw new ConflictException(`Document with ID "${id}" is not deleted`);
    }
    return this.documentRepository.restore(id);
  }

  async linkToEntity(documentId: string, entityType: string, entityId: string) {
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) {
      throw new NotFoundException(`Document with ID "${documentId}" not found`);
    }

    const existing = await this.linkRepository.findOne({
      where: { documentId, entityType, entityId },
    });

    if (existing) {
      throw new ConflictException('Document is already linked to this entity');
    }

    const link = this.linkRepository.create({
      documentId,
      entityType,
      entityId,
    });

    return this.linkRepository.save(link);
  }

  async unlinkFromEntity(documentId: string, entityType: string, entityId: string) {
    const link = await this.linkRepository.findOne({
      where: { documentId, entityType, entityId },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.linkRepository.remove(link);
  }

  async count() {
    return this.documentRepository.count();
  }

  private async generateDocumentNumber(): Promise<string> {
    const count = await this.documentRepository.count();
    const next = count + 1;
    return `DOC-${String(next).padStart(5, '0')}`;
  }
}
