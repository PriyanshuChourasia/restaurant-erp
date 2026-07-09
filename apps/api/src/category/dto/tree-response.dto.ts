export class TreeCategoryDto {
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
  children: TreeCategoryDto[];
}

export class TreeResponseDto {
  items: TreeCategoryDto[];
}
