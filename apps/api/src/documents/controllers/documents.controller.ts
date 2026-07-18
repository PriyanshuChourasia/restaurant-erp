import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import * as express from 'express';
import type { Express } from 'express';
import { DocumentsService } from '../services/documents.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { QueryDocumentDto } from '../dto/query-document.dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import type { IActiveUser } from '../../shared/interfaces/active-user.interface';

const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'text/plain',
  'text/csv',
];

const storage = diskStorage({
  destination: './uploads/documents',
  filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @Permissions('documents.read')
  findAll(@Query(new ValidationPipe({ transform: true })) query: QueryDocumentDto) {
    return this.documentsService.findAll(query);
  }

  @Get('count')
  @Permissions('documents.read')
  count() {
    return this.documentsService.count();
  }

  @Get('entity/:entityType/:entityId')
  @Permissions('documents.read')
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.documentsService.findByEntity(entityType, entityId);
  }

  @Get('files/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: express.Response) {
    const filePath = join(process.cwd(), 'uploads', 'documents', filename);
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    return res.sendFile(filePath);
  }

  @Get(':id')
  @Permissions('documents.read')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post()
  @Permissions('documents.create')
  create(
    @Body(new ValidationPipe({ transform: true })) dto: CreateDocumentDto,
    @CurrentUser() user: IActiveUser,
  ) {
    return this.documentsService.create(dto, user.id);
  }

  @Post('upload')
  @Permissions('documents.create')
  @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 50 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body(new ValidationPipe({ transform: true })) dto: CreateDocumentDto,
    @CurrentUser() user: IActiveUser,
  ) {
    return this.documentsService.uploadFile(file, dto, user.id);
  }

  @Post(':id/link')
  @Permissions('documents.update')
  linkToEntity(
    @Param('id') id: string,
    @Body() body: { entityType: string; entityId: string },
  ) {
    return this.documentsService.linkToEntity(id, body.entityType, body.entityId);
  }

  @Delete(':id/link')
  @Permissions('documents.update')
  unlinkFromEntity(
    @Param('id') id: string,
    @Body() body: { entityType: string; entityId: string },
  ) {
    return this.documentsService.unlinkFromEntity(id, body.entityType, body.entityId);
  }

  @Patch(':id')
  @Permissions('documents.update')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('documents.delete')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }

  @Post(':id/restore')
  @Permissions('documents.update')
  restore(@Param('id') id: string) {
    return this.documentsService.restore(id);
  }
}
