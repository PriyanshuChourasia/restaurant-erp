import { IsOptional, IsUUID } from 'class-validator';

export class MoveCategoryDto {
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
