import { PartialType } from '@nestjs/mapped-types';
import { CreatePriceLevelDto } from './create-price-level.dto';

export class UpdatePriceLevelDto extends PartialType(CreatePriceLevelDto) {}
