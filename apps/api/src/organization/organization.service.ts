import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OrganizationService.name);
  private cached: Organization | null = null;

  constructor(
    @InjectRepository(Organization)
    private readonly repo: Repository<Organization>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.repo.count();
    if (count === 0) {
      const org = this.repo.create({
        restaurantName: 'My Restaurant',
        tagline: 'Fine Dining Experience',
        currency: 'INR',
        currencySymbol: '₹',
        timezone: 'Asia/Kolkata',
        taxLabel: 'GST',
        defaultTaxRate: 0,
        serviceChargePercent: 0,
        isActive: true,
      });
      await this.repo.save(org);
      this.logger.log('Created default organization settings.');
    }
  }

  async getSettings(): Promise<Organization> {
    if (this.cached) return this.cached;
    const org = await this.repo.findOne({ where: { isActive: true } });
    if (!org) {
      // Fallback: create one
      const created = this.repo.create({
        restaurantName: 'My Restaurant',
        isActive: true,
      });
      const saved = await this.repo.save(created);
      this.cached = saved;
      return saved;
    }
    this.cached = org;
    return org;
  }

  async update(dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.getSettings();
    Object.assign(org, dto);
    const saved = await this.repo.save(org);
    this.cached = saved;
    return saved;
  }
}
