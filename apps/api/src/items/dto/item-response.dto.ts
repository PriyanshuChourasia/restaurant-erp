import { Expose, Transform } from 'class-transformer';

export class ItemResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string | null;

  @Expose()
  sku: string;

  @Expose()
  hsnCode: string;

  @Expose()
  price: number;

  @Expose()
  costPrice: number;

  @Expose()
  gstRate: number;

  @Expose()
  unit: string;

  @Expose()
  isActive: boolean;

  @Expose()
  isVeg: boolean;

  @Expose()
  image: string | null;

  @Expose()
  categoryId: string | null;

  @Expose()
  categoryName: string | null;

  @Expose()
  @Transform(({ obj }) => {
    const rate = obj.gstRate;
    return {
      cgst: rate / 2,
      sgst: rate / 2,
      total: rate,
    };
  })
  gstBreakdown: { cgst: number; sgst: number; total: number };

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
