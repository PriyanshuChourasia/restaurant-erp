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
} from '@nestjs/common';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { QueryCustomerDto } from '../dto/query-customer.dto';
import { Permissions } from '../../shared/decorators/permissions.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Query(new ValidationPipe({ transform: true })) query: QueryCustomerDto) {
    return this.customersService.findAll(query);
  }

  @Get('search')
  search(@Query('q') q?: string) {
    return this.customersService.search(q || '', 10);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  create(@Body(new ValidationPipe({ transform: true })) dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('customers.delete')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  @Post(':id/restore')
  @Permissions('customers.update')
  restore(@Param('id') id: string) {
    return this.customersService.restore(id);
  }
}
