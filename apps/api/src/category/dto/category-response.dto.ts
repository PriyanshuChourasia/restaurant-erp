export class CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  parentId: string | null;
  path: string;
  level: number;
  icon: string | null;
  image: string | null;
  childrenCount: number;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
