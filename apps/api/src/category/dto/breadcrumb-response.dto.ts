export class BreadcrumbItemDto {
  id: string;
  name: string;
  slug: string;
  level: number;
}

export class BreadcrumbResponseDto {
  items: BreadcrumbItemDto[];
}
