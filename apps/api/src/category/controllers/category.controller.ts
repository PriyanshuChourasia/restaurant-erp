import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { MoveCategoryDto } from '../dto/move-category.dto';
import { SearchQueryDto } from '../dto/search-query.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Permissions } from '../../shared/decorators/permissions.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // ---- Create ----
  // POST /categories
  @Post()
  @Permissions('menu.create')
  create(
    @Body(new ValidationPipe({ transform: true })) dto: CreateCategoryDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.categoryService.create(dto, userId);
  }

  // ---- Update ----
  // PUT /categories/:id
  @Put(':id')
  @Permissions('menu.update')
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) dto: UpdateCategoryDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.categoryService.update(id, dto, userId);
  }

  // ---- Get By ID ----
  // GET /categories/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  // ---- List ----
  // GET /categories
  @Get()
  findAll(
    @Query(new ValidationPipe({ transform: true })) query: SearchQueryDto,
  ) {
    return this.categoryService.findAll(query);
  }

  // ---- Tree ----
  // GET /categories/tree
  // NOTE: This must come BEFORE /categories/:id to avoid route conflict
  @Get('tree')
  getTree() {
    return this.categoryService.getTree();
  }

  // ---- Root Categories ----
  // GET /categories/root
  @Get('root')
  getRoots(
    @Query(new ValidationPipe({ transform: true })) query: SearchQueryDto,
  ) {
    return this.categoryService.getRoots(query);
  }

  // ---- Children ----
  // GET /categories/:id/children
  @Get(':id/children')
  getChildren(@Param('id') id: string) {
    return this.categoryService.getChildren(id);
  }

  // ---- Descendants ----
  // GET /categories/:id/descendants
  @Get(':id/descendants')
  getDescendants(@Param('id') id: string) {
    return this.categoryService.getDescendants(id);
  }

  // ---- Ancestors ----
  // GET /categories/:id/ancestors
  @Get(':id/ancestors')
  getAncestors(@Param('id') id: string) {
    return this.categoryService.getAncestors(id);
  }

  // ---- Breadcrumb ----
  // GET /categories/:id/breadcrumb
  @Get(':id/breadcrumb')
  getBreadcrumb(@Param('id') id: string) {
    return this.categoryService.getBreadcrumb(id);
  }

  // ---- Move ----
  // PATCH /categories/:id/move
  @Patch(':id/move')
  @Permissions('menu.update')
  move(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true })) dto: MoveCategoryDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.categoryService.move(id, dto, userId);
  }

  // ---- Activate ----
  // PATCH /categories/:id/activate
  @Patch(':id/activate')
  @Permissions('menu.update')
  activate(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.categoryService.activate(id, userId);
  }

  // ---- Deactivate ----
  // PATCH /categories/:id/deactivate
  @Patch(':id/deactivate')
  @Permissions('menu.update')
  deactivate(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.categoryService.deactivate(id, userId);
  }

  // ---- Delete ----
  // DELETE /categories/:id?force=true
  @Delete(':id')
  @Permissions('menu.delete')
  remove(
    @Param('id') id: string,
    @Query('force') force?: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.categoryService.remove(id, force === 'true', userId);
  }

  // ---- Restore ----
  // PATCH /categories/:id/restore
  @Patch(':id/restore')
  @Permissions('menu.update')
  restore(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.categoryService.restore(id, userId);
  }
}
