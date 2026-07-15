import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { CategoryEntity } from '../category/entities/category.entity';
import { Item, GstRate, ItemType } from '../items/entities/item.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Inventory, StockMovement, MovementType } from '../inventory/entities/inventory.entity';
import { OpeningStockEntry } from '../inventory/entities/opening-stock-entry.entity';
import { LedgerAccount, LedgerEntry, LedgerEntryType, LedgerCategory, AccountType } from '../ledger/entities/ledger.entity';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod } from '../sales/entities/sales.entity';
import { Kot, KotItem, KotStatus, KotStation } from '../kot/entities/kot.entity';
import { Purchase, PurchaseItem, PurchaseStatus } from '../purchases/entities/purchase.entity';
import { Zone } from '../seating/entities/zone.entity';
import { Table, TableCategory, TableStatus } from '../seating/entities/table.entity';
import { Unit, UnitType } from '../units/entities/unit.entity';
import { UnitConversion } from '../units/entities/unit-conversion.entity';
import { StorageUnit, StorageUnitType } from '../inventory/entities/storage-unit.entity';
import { StockBatch, BatchStatus } from '../inventory/entities/stock-batch.entity';
import { StockCount, StockCountLine, StockCountStatus } from '../inventory/entities/stock-count.entity';
import { Customer } from '../customers/entities/customer.entity';
import { PriceLevel } from '../price-levels/entities/price-level.entity';
import { ItemPriceLevel } from '../price-levels/entities/item-price-level.entity';
import { Recipe, RecipeIngredient } from '../recipes/entities/recipe.entity';
import { Reservation, ReservationStatus, ReservationSource } from '../reservations/entities/reservation.entity';
import { ItemSupplier } from '../item-suppliers/entities/item-supplier.entity';

const MODULES = [
  'auth', 'users', 'roles', 'permissions',
  'menu', 'orders', 'inventory', 'staff', 'reservations', 'reports', 'settings',
  'items', 'purchases', 'suppliers', 'sales', 'kot', 'ledger', 'vouchers',
] as const;

const CRUD_ACTIONS = ['create', 'read', 'update', 'delete'] as const;

function buildPermissionName(module: string, action: string): string {
  return `${module}.${action}`;
}

function buildDescription(module: string, action: string): string {
  const actionMap: Record<string, string> = {
    create: `Create ${module}`,
    read: `View ${module}`,
    update: `Update ${module}`,
    delete: `Delete ${module}`,
  };
  return actionMap[action] || `${action} ${module}`;
}

const EXTRA_PERMISSIONS = [
  { name: 'orders.manage', description: 'Manage order lifecycle', module: 'orders' },
  { name: 'menu.publish', description: 'Publish menu changes', module: 'menu' },
  { name: 'reports.export', description: 'Export reports', module: 'reports' },
  { name: 'staff.schedule', description: 'Manage staff schedules', module: 'staff' },
  { name: 'kot.assign', description: 'Assign KOT to stations', module: 'kot' },
  { name: 'kot.print', description: 'Print KOT tickets', module: 'kot' },
  { name: 'sales.discount', description: 'Apply discounts on sales', module: 'sales' },
  { name: 'ledger.reconcile', description: 'Reconcile ledger entries', module: 'ledger' },
  { name: 'purchases.approve', description: 'Approve purchase orders', module: 'purchases' },
  { name: 'sales.cancel', description: 'Cancel a confirmed invoice', module: 'sales' },
  { name: 'vouchers.cancel', description: 'Cancel a posted voucher', module: 'vouchers' },
  { name: 'sales.credit-note', description: 'Issue a credit note against an invoice', module: 'sales' },
];

interface DemoUser {
  name: string;
  email: string;
  password: string;
  phone: string;
  roleName: string;
}

const DEMO_USERS: DemoUser[] = [
  { name: 'Admin User', email: 'admin@restaurant.com', password: 'Admin@123456', phone: '+91 98765 43210', roleName: 'admin' },
  { name: 'John Manager', email: 'manager@restaurant.com', password: 'Manager@123456', phone: '+91 98765 43211', roleName: 'manager' },
  { name: 'Sarah Staff', email: 'staff@restaurant.com', password: 'Staff@123456', phone: '+91 98765 43212', roleName: 'staff' },
  { name: 'Raja Chef', email: 'chef@restaurant.com', password: 'Chef@123456', phone: '+91 98765 43214', roleName: 'chef' },
  { name: 'Priya Cashier', email: 'cashier@restaurant.com', password: 'Cashier@123456', phone: '+91 98765 43215', roleName: 'cashier' },
  { name: 'Amit Waiter', email: 'waiter@restaurant.com', password: 'Waiter@123456', phone: '+91 98765 43216', roleName: 'waiter' },
];

// ─── Role definitions ───────────────────────────────────────────
const ROLE_DEFS: Array<{
  name: string;
  description: string;
  include: Set<string> | '*';
  exclude?: Set<string>;
}> = [
  { name: 'admin', description: 'System administrator with full access', include: '*' },
  {
    name: 'manager',
    description: 'Restaurant manager with operational access',
    include: '*',
    exclude: new Set([
      'permissions.create', 'permissions.delete',
      'roles.create', 'roles.delete',
      'users.delete',
    ]),
  },
  {
    name: 'chef',
    description: 'Kitchen chef with KOT and menu access',
    include: new Set([
      'menu.read', 'menu.update',
      'orders.read', 'orders.create', 'orders.update',
      'items.read',
      'inventory.read', 'inventory.update',
      'kot.read', 'kot.create', 'kot.update', 'kot.assign', 'kot.print',
      'staff.read',
    ]),
  },
  {
    name: 'cashier',
    description: 'Cashier with billing and sales access',
    include: new Set([
      'orders.read', 'orders.create', 'orders.update',
      'sales.read', 'sales.create', 'sales.update', 'sales.discount', 'sales.cancel', 'sales.credit-note',
      'menu.read',
      'items.read',
      'reports.read',
      'ledger.read',
      'vouchers.read', 'vouchers.create',
    ]),
  },
  {
    name: 'waiter',
    description: 'Waiter with order-taking access',
    include: new Set([
      'menu.read',
      'items.read',
      'orders.read', 'orders.create', 'orders.update',
      'kot.read',
      'reservations.read', 'reservations.create',
    ]),
  },
  {
    name: 'staff',
    description: 'Restaurant staff with basic operational access',
    include: new Set([
      'menu.read', 'menu.update',
      'orders.read', 'orders.create', 'orders.update', 'orders.manage',
      'inventory.read', 'inventory.update',
      'staff.read',
      'reservations.read', 'reservations.create', 'reservations.update',
      'kot.read',
    ]),
  },
];

// ─── Demo seed data ─────────────────────────────────────────────

const DEMO_SUPPLIERS: Array<Partial<Supplier>> = [
  { name: 'Fresh Foods Co.', email: 'info@freshfoods.in', phone: '+91 99999 00001', gstin: '27AABCF1234G1Z2', address: 'Mumbai, Maharashtra', contactPerson: 'Ramesh Patel' },
  { name: 'Spice World Traders', email: 'orders@spiceworld.in', phone: '+91 99999 00002', gstin: '29AABCS5678H1Z3', address: 'Jaipur, Rajasthan', contactPerson: 'Suresh Kumar' },
  { name: 'Dairy Best Supplies', email: 'info@dairybest.in', phone: '+91 99999 00003', gstin: '07AABCT9012I1Z4', address: 'Delhi, NCR', contactPerson: 'Mohan Lal' },
  { name: 'Organic Harvest', email: 'sales@organicharvest.in', phone: '+91 99999 00004', gstin: '33AABCO3456J1Z5', address: 'Coimbatore, Tamil Nadu', contactPerson: 'Kavitha Devi' },
  { name: 'Beverage Hub', email: 'info@beveragehub.in', phone: '+91 99999 00005', gstin: '09AABCB7890K1Z6', address: 'Pune, Maharashtra', contactPerson: 'Amit Shah' },
];

interface DemoItemDef {
  name: string
  sku: string
  hsnCode: string
  price: number
  costPrice: number
  gstRate: GstRate
  unitCode: string       // references a seeded Unit.code
  purchaseUnitCode?: string
  isVeg: boolean
  categoryId: string
  itemType?: ItemType
  isTaxable?: boolean
  cessPercent?: number
  reverseCharge?: boolean
}

const DEMO_ITEM_DEFS: DemoItemDef[] = [
  { name: 'Butter Chicken', sku: 'M-001', hsnCode: '2105', price: 349, costPrice: 200, gstRate: GstRate.FIVE, unitCode: 'bowl', isVeg: false, categoryId: 'a0000001-0000-0000-0000-000000000009' },
  { name: 'Dal Makhani', sku: 'M-002', hsnCode: '2104', price: 249, costPrice: 80, gstRate: GstRate.FIVE, unitCode: 'bowl', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000008' },
  { name: 'Chicken Biryani', sku: 'M-003', hsnCode: '2105', price: 299, costPrice: 150, gstRate: GstRate.FIVE, unitCode: 'plate', isVeg: false, categoryId: 'a0000001-0000-0000-0000-000000000009' },
  { name: 'Veg Biryani', sku: 'M-004', hsnCode: '2104', price: 249, costPrice: 100, gstRate: GstRate.FIVE, unitCode: 'plate', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000008' },
  { name: 'Paneer Tikka', sku: 'S-001', hsnCode: '2104', price: 199, costPrice: 80, gstRate: GstRate.FIVE, unitCode: 'plate', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000003' },
  { name: 'Chicken Tikka', sku: 'S-002', hsnCode: '2105', price: 229, costPrice: 120, gstRate: GstRate.FIVE, unitCode: 'plate', isVeg: false, categoryId: 'a0000001-0000-0000-0000-000000000003' },
  { name: 'Tomato Soup', sku: 'S-003', hsnCode: '2104', price: 149, costPrice: 50, gstRate: GstRate.NIL, unitCode: 'bowl', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000010' },
  { name: 'Masala Dosa', sku: 'S-004', hsnCode: '2104', price: 179, costPrice: 40, gstRate: GstRate.FIVE, unitCode: 'plate', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000003' },
  { name: 'Gulab Jamun', sku: 'D-001', hsnCode: '1704', price: 89, costPrice: 30, gstRate: GstRate.FIVE, unitCode: 'plate', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000005' },
  { name: 'Ice Cream', sku: 'D-002', hsnCode: '2105', price: 99, costPrice: 40, gstRate: GstRate.TWELVE, unitCode: 'cup', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000005' },
  { name: 'Masala Chai', sku: 'B-001', hsnCode: '0902', price: 39, costPrice: 10, gstRate: GstRate.FIVE, unitCode: 'cup', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000006' },
  { name: 'Cold Coffee', sku: 'B-002', hsnCode: '2202', price: 129, costPrice: 40, gstRate: GstRate.TWELVE, unitCode: 'glass', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000007' },
  { name: 'Fresh Lime Soda', sku: 'B-003', hsnCode: '2202', price: 69, costPrice: 15, gstRate: GstRate.TWELVE, unitCode: 'glass', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000007' },
  { name: 'Naan Bread', sku: 'S-005', hsnCode: '1905', price: 39, costPrice: 10, gstRate: GstRate.NIL, unitCode: 'piece', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000003' },
  { name: 'Tandoori Roti', sku: 'S-006', hsnCode: '1905', price: 29, costPrice: 8, gstRate: GstRate.NIL, unitCode: 'piece', isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000003' },
];

const DEMO_LEDGER_ACCOUNTS: Array<Partial<LedgerAccount>> = [
  { name: 'Cash Account', accountType: AccountType.ASSET, description: 'Cash in hand', openingBalance: 50000, financialYear: '2026-27' },
  { name: 'Sales Revenue', accountType: AccountType.REVENUE, description: 'Revenue from food sales', openingBalance: 0, financialYear: '2026-27' },
  { name: 'Purchase Account', accountType: AccountType.EXPENSE, description: 'Inventory purchase expenses', openingBalance: 0, financialYear: '2026-27' },
  { name: 'GST Payable', accountType: AccountType.LIABILITY, description: 'GST collected from customers', openingBalance: 0, financialYear: '2026-27' },
  { name: 'GST Input Credit', accountType: AccountType.ASSET, description: 'GST paid on purchases', openingBalance: 0, financialYear: '2026-27' },
  { name: 'Salary Account', accountType: AccountType.EXPENSE, description: 'Employee salary expenses', openingBalance: 0, financialYear: '2026-27' },
  { name: 'Rent Account', accountType: AccountType.EXPENSE, description: 'Restaurant rent expenses', openingBalance: 0, financialYear: '2026-27' },
  { name: 'Bank Account', accountType: AccountType.ASSET, description: 'Business bank account', openingBalance: 200000, financialYear: '2026-27' },
  // Module 5: Inventory ledger accounts
  { name: 'Inventory Asset', accountType: AccountType.ASSET, description: 'Value of stock on hand', openingBalance: 0, financialYear: '2026-27' },
  { name: 'COGS', accountType: AccountType.EXPENSE, description: 'Cost of goods sold', openingBalance: 0, financialYear: '2026-27' },
  { name: 'Purchase Payable', accountType: AccountType.LIABILITY, description: 'Amounts owed to suppliers for purchases', openingBalance: 0, financialYear: '2026-27' },
  { name: 'Wastage & Spoilage', accountType: AccountType.EXPENSE, description: 'Stock losses from wastage', openingBalance: 0, financialYear: '2026-27' },
  { name: 'Stock Adjustment', accountType: AccountType.EXPENSE, description: 'Adjustments from stock counts', openingBalance: 0, financialYear: '2026-27' },
  // Vouchers module: receivables for credit sales
  { name: 'Accounts Receivable', accountType: AccountType.ASSET, description: 'Amounts owed by customers for credit sales', openingBalance: 0, financialYear: '2026-27' },
];

// ─── Service ────────────────────────────────────────────────────

@Injectable()
export class DatabaseSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeedService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepo: Repository<StockMovement>,
    @InjectRepository(LedgerAccount)
    private readonly ledgerRepo: Repository<LedgerAccount>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerEntryRepo: Repository<LedgerEntry>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly invoiceItemRepo: Repository<InvoiceItem>,
    @InjectRepository(Kot)
    private readonly kotRepo: Repository<Kot>,
    @InjectRepository(KotItem)
    private readonly kotItemRepo: Repository<KotItem>,
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private readonly purchaseItemRepo: Repository<PurchaseItem>,
    @InjectRepository(Zone)
    private readonly zoneRepo: Repository<Zone>,
    @InjectRepository(Table)
    private readonly tableRepo: Repository<Table>,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(UnitConversion)
    private readonly conversionRepo: Repository<UnitConversion>,
    @InjectRepository(OpeningStockEntry)
    private readonly openingStockEntryRepo: Repository<OpeningStockEntry>,
    @InjectRepository(StorageUnit)
    private readonly storageUnitRepo: Repository<StorageUnit>,
    @InjectRepository(StockBatch)
    private readonly batchRepo: Repository<StockBatch>,
    @InjectRepository(StockCount)
    private readonly stockCountRepo: Repository<StockCount>,
    @InjectRepository(StockCountLine)
    private readonly stockCountLineRepo: Repository<StockCountLine>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(PriceLevel)
    private readonly priceLevelRepo: Repository<PriceLevel>,
    @InjectRepository(ItemPriceLevel)
    private readonly itemPriceLevelRepo: Repository<ItemPriceLevel>,
    @InjectRepository(Recipe)
    private readonly recipeRepo: Repository<Recipe>,
    @InjectRepository(RecipeIngredient)
    private readonly ingredientRepo: Repository<RecipeIngredient>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(ItemSupplier)
    private readonly itemSupplierRepo: Repository<ItemSupplier>,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Checking seed data...');

    const allPermissions = await this.seedPermissions();
    const roleMap = await this.seedRoles(allPermissions);
    await this.seedUsers(roleMap);
    await this.seedCategories();
    await this.seedSuppliers();
    await this.seedStorageUnit();
    await this.seedUnits();
    await this.seedUnitConversions();
    const items = await this.seedItems();
    await this.seedInventory(items);
    await this.seedLedgerAccounts();
    await this.seedStockMovements(items);
    await this.seedOpeningStockEntries(items);
    await this.seedPurchases(items);
    await this.seedInvoices(items);
    await this.seedKots(items);
    await this.seedLedgerEntries();
    await this.seedZones();
    await this.seedTables();
    await this.seedSecondStorageUnit();  // Module 2: second location
    await this.seedBatches(items);            // Module 6: stock batches
    await this.seedCustomers();               // Module: customers
    await this.seedPriceLevels(items);        // Module: price levels
    await this.seedRecipes(items);            // Module: recipes
    await this.seedReservations();            // Module: reservations
    await this.seedStockCounts(items);        // Module 8: completed stock count
    await this.seedItemSuppliers(items);          // Item-Supplier links

    this.logger.log('Seed check complete.');
    this.logUsageGuide();
  }

  // ── Permissions ─────────────────────────────────────────────

  private async seedPermissions(): Promise<Permission[]> {
    const allPermissions: Permission[] = [];
    let addedCount = 0;

    for (const module of MODULES) {
      for (const action of CRUD_ACTIONS) {
        const name = buildPermissionName(module, action);
        let perm = await this.permissionRepo.findOne({ where: { name } });
        if (!perm) {
          perm = this.permissionRepo.create({
            name,
            description: buildDescription(module, action),
            module,
          });
          perm = await this.permissionRepo.save(perm);
          addedCount++;
        }
        allPermissions.push(perm);
      }
    }

    for (const extra of EXTRA_PERMISSIONS) {
      let perm = await this.permissionRepo.findOne({ where: { name: extra.name } });
      if (!perm) {
        perm = this.permissionRepo.create(extra);
        perm = await this.permissionRepo.save(perm);
        addedCount++;
      }
      allPermissions.push(perm);
    }

    if (addedCount > 0) {
      this.logger.log(`Added ${addedCount} new permissions. Total ${allPermissions.length}.`);
    } else {
      this.logger.log(`All ${allPermissions.length} permissions already exist.`);
    }
    return allPermissions;
  }

  // ── Roles ───────────────────────────────────────────────────

  private async seedRoles(permissions: Permission[]): Promise<Map<string, Role>> {
    const roleMap = new Map<string, Role>();
    const permByName = new Map(permissions.map((p) => [p.name, p]));

    for (const def of ROLE_DEFS) {
      let role = await this.roleRepo.findOne({ where: { name: def.name }, relations: { permissions: true } });
      if (!role) {
        role = this.roleRepo.create({
          name: def.name,
          description: def.description,
          isSystem: true,
        });
      }

      let rolePerms: Permission[];
      if (def.include === '*') {
        rolePerms = permissions.filter((p) => !def.exclude?.has(p.name));
      } else {
        rolePerms = [...def.include].map((n) => permByName.get(n)).filter(Boolean) as Permission[];
      }

      role.description = def.description;
      role.permissions = rolePerms;
      role = await this.roleRepo.save(role);
      roleMap.set(def.name, role);
      this.logger.log(`Role "${def.name}" synced with ${rolePerms.length} permissions.`);
    }

    return roleMap;
  }

  // ── Users ───────────────────────────────────────────────────

  private async seedUsers(roleMap: Map<string, Role>): Promise<void> {
    let addedCount = 0;

    for (const demo of DEMO_USERS) {
      const existing = await this.userRepo.findOne({ where: { email: demo.email } });
      if (existing) continue;

      const role = roleMap.get(demo.roleName);
      if (!role) {
        this.logger.warn(`Role "${demo.roleName}" not found — skipping user "${demo.email}"`);
        continue;
      }

      const passwordHash = await bcrypt.hash(demo.password, 12);
      await this.userRepo.save(
        this.userRepo.create({
          name: demo.name,
          email: demo.email,
          passwordHash,
          phone: demo.phone,
          roleId: role.id,
          isActive: true,
        }),
      );
      addedCount++;
    }

    if (addedCount > 0) {
      this.logger.log(`Added ${addedCount} new demo users. Total ${DEMO_USERS.length}.`);
    } else {
      this.logger.log('All demo users already exist.');
    }
  }

  // ── Categories ──────────────────────────────────────────────

  private async seedCategories(): Promise<void> {
    const count = await this.categoryRepo.count();
    if (count > 0) {
      this.logger.log(`${count} categories already exist — skipping.`);
      return;
    }

    const food = await this.categoryRepo.save(
      this.categoryRepo.create({
        id: 'a0000001-0000-0000-0000-000000000001',
        name: 'Food', slug: 'food', description: 'All food menu items',
        displayOrder: 1, isActive: true, parentId: null, path: '', level: 0,
      }),
    );
    const beverages = await this.categoryRepo.save(
      this.categoryRepo.create({
        id: 'a0000001-0000-0000-0000-000000000002',
        name: 'Beverages', slug: 'beverages', description: 'All drink menu items',
        displayOrder: 2, isActive: true, parentId: null, path: '', level: 0,
      }),
    );
    const appetizers = await this.categoryRepo.save(
      this.categoryRepo.create({
        id: 'a0000001-0000-0000-0000-000000000003',
        name: 'Appetizers', slug: 'appetizers', description: 'Starters and small plates',
        displayOrder: 1, isActive: true, parentId: food.id, path: `${food.id}/`, level: 1,
      }),
    );
    const mainCourse = await this.categoryRepo.save(
      this.categoryRepo.create({
        id: 'a0000001-0000-0000-0000-000000000004',
        name: 'Main Course', slug: 'main-course', description: 'Main dishes and entrees',
        displayOrder: 2, isActive: true, parentId: food.id, path: `${food.id}/`, level: 1,
      }),
    );
    await this.categoryRepo.save(
      this.categoryRepo.create({
        id: 'a0000001-0000-0000-0000-000000000005',
        name: 'Desserts', slug: 'desserts', description: 'Sweet treats and desserts',
        displayOrder: 3, isActive: true, parentId: food.id, path: `${food.id}/`, level: 1,
      }),
    );
    await this.categoryRepo.save(
      this.categoryRepo.create({
        id: 'a0000001-0000-0000-0000-000000000006',
        name: 'Hot Beverages', slug: 'hot-beverages', description: 'Coffee, tea, and hot drinks',
        displayOrder: 1, isActive: true, parentId: beverages.id, path: `${beverages.id}/`, level: 1,
      }),
    );
    await this.categoryRepo.save(
      this.categoryRepo.create({
        id: 'a0000001-0000-0000-0000-000000000007',
        name: 'Cold Beverages', slug: 'cold-beverages', description: 'Soft drinks, juices, and cold drinks',
        displayOrder: 2, isActive: true, parentId: beverages.id, path: `${beverages.id}/`, level: 1,
      }),
    );
    await this.categoryRepo.save(
      this.categoryRepo.create({
        id: 'a0000001-0000-0000-0000-000000000008',
        name: 'Vegetarian', slug: 'vegetarian', description: 'Vegetarian main course options',
        displayOrder: 1, isActive: true, parentId: mainCourse.id,
        path: `${mainCourse.path}${mainCourse.id}/`, level: 2,
      }),
    );
    await this.categoryRepo.save(
      this.categoryRepo.create({
        id: 'a0000001-0000-0000-0000-000000000009',
        name: 'Non-Vegetarian', slug: 'non-vegetarian', description: 'Non-vegetarian main course options',
        displayOrder: 2, isActive: true, parentId: mainCourse.id,
        path: `${mainCourse.path}${mainCourse.id}/`, level: 2,
      }),
    );
    await this.categoryRepo.save(
      this.categoryRepo.create({
        id: 'a0000001-0000-0000-0000-000000000010',
        name: 'Soups', slug: 'soups', description: 'Soups and broths',
        displayOrder: 1, isActive: true, parentId: appetizers.id,
        path: `${appetizers.path}${appetizers.id}/`, level: 2,
      }),
    );
    await this.categoryRepo.save(
      this.categoryRepo.create({
        id: 'a0000001-0000-0000-0000-000000000011',
        name: 'Salads', slug: 'salads', description: 'Fresh salads',
        displayOrder: 2, isActive: true, parentId: appetizers.id,
        path: `${appetizers.path}${appetizers.id}/`, level: 2,
      }),
    );
    this.logger.log('Seeded 11 demo categories with 3-level hierarchy.');
  }

  // ── Suppliers ───────────────────────────────────────────────

  private async seedSuppliers(): Promise<void> {
    const count = await this.supplierRepo.count();
    if (count > 0) {
      this.logger.log(`${count} suppliers already exist — skipping.`);
      return;
    }

    for (const data of DEMO_SUPPLIERS) {
      const supplier = this.supplierRepo.create(data as Supplier);
      await this.supplierRepo.save(supplier);
    }
    this.logger.log(`Seeded ${DEMO_SUPPLIERS.length} demo suppliers.`);
  }

  // ── Items ───────────────────────────────────────────────────

  private async seedItems(): Promise<Item[]> {
    const count = await this.itemRepo.count();
    if (count > 0) {
      this.logger.log(`${count} items already exist — skipping.`);
      return this.itemRepo.find();
    }

    // Build a map of unitCode -> unitId from the seeded units
    const units = await this.unitRepo.find();
    const unitByCode = new Map(units.map((u) => [u.code, u.id]));

    const saved: Item[] = [];
    for (const def of DEMO_ITEM_DEFS) {
      const unitId = unitByCode.get(def.unitCode);
      if (!unitId) {
        this.logger.warn(`Unit code "${def.unitCode}" not found — skipping item "${def.name}"`);
        continue;
      }

      let purchaseUnitId: string | null = null;
      if (def.purchaseUnitCode) {
        purchaseUnitId = unitByCode.get(def.purchaseUnitCode) || null;
      }

      const itemData: Partial<Item> = {
        name: def.name,
        sku: def.sku,
        hsnCode: def.hsnCode,
        price: def.price,
        costPrice: def.costPrice,
        gstRate: def.gstRate,
        unitId,
        purchaseUnitId,
        isVeg: def.isVeg,
        categoryId: def.categoryId,
        isActive: true,
        itemType: def.itemType ?? ItemType.GOODS,
        isTaxable: def.isTaxable !== false,
        cessPercent: def.cessPercent || 0,
        reverseCharge: def.reverseCharge || false,
        productType: 'finished' as any,
        shelfLifeDays: def.name === 'Ice Cream' ? 30 : def.name === 'Chicken Tikka' || def.name === 'Butter Chicken' ? 5 : def.name === 'Fresh Lime Soda' ? 14 : null,
      };
      const item = this.itemRepo.create(itemData as Item);
      saved.push(await this.itemRepo.save(item));
    }
    this.logger.log(`Seeded ${saved.length} demo menu items.`);
    return saved;
  }

  // ── Inventory ───────────────────────────────────────────────

  private async seedInventory(items: Item[]): Promise<void> {
    const count = await this.inventoryRepo.count();
    if (count > 0) {
      this.logger.log(`${count} inventory records already exist — skipping.`);
      return;
    }

    const defaultSu = await this.storageUnitRepo.findOne({ where: { isDefault: true } });
    const storageUnitId = defaultSu ? defaultSu.id : (await this.storageUnitRepo.find())[0]?.id;
    if (!storageUnitId) {
      this.logger.warn('No storage unit found — skipping inventory seed');
      return;
    }

    for (const item of items) {
      await this.inventoryRepo.save(
        this.inventoryRepo.create({
          itemId: item.id,
          storageUnitId,
          openingBalance: 50,
          currentStock: 50,
          minStockLevel: 10,
          unitCost: item.costPrice || 0,
        }),
      );
    }
    this.logger.log(`Seeded inventory for ${items.length} items (opening stock: 50 each, at ${defaultSu?.name || 'Main Store'}).`);
  }

  // ── Stock Movements ─────────────────────────────────────────

  private async seedStockMovements(items: Item[]): Promise<void> {
    const count = await this.stockMovementRepo.count();
    if (count > 0) {
      this.logger.log(`${count} stock movements already exist — skipping.`);
      return;
    }

    const defaultSu = await this.storageUnitRepo.findOne({ where: { isDefault: true } });
    const storageUnitId = defaultSu ? defaultSu.id : null;
    if (!storageUnitId) return;

    for (const item of items) {
      await this.stockMovementRepo.save(
        this.stockMovementRepo.create({
          itemId: item.id,
          storageUnitId,
          type: MovementType.OPENING_BALANCE,
          quantity: 50,
          balanceBefore: 0,
          balanceAfter: 50,
          reference: 'Initial seed',
          notes: 'Opening balance',
        }),
      );
    }
    this.logger.log(`Seeded opening balance stock movements for ${items.length} items.`);
  }

  // ── Opening Stock Entries ─────────────────────────────────────

  private async seedOpeningStockEntries(items: Item[]): Promise<void> {
    const count = await this.openingStockEntryRepo.count();
    if (count > 0) {
      this.logger.log(`${count} opening stock entries already exist — skipping.`);
      return;
    }

    const defaultSu = await this.storageUnitRepo.findOne({ where: { isDefault: true } });
    const storageUnitId = defaultSu ? defaultSu.id : null;
    if (!storageUnitId) return;

    const movements = await this.stockMovementRepo.find({
      where: { storageUnitId, type: MovementType.OPENING_BALANCE },
    });
    const movementByItemId = new Map(movements.map((m) => [m.itemId, m]));

    let addedCount = 0;
    for (const item of items) {
      const movement = movementByItemId.get(item.id);
      if (!movement) continue;

      await this.openingStockEntryRepo.save(
        this.openingStockEntryRepo.create({
          itemId: item.id,
          storageUnitId: storageUnitId!,
          quantity: 50,
          unitCost: item.costPrice || 0,
          asOfDate: new Date(),
          stockMovementId: movement.id,
        }),
      );
      addedCount++;
    }

    this.logger.log(`Seeded ${addedCount} opening stock entries linking to stock movements.`);
  }

  // ── Purchases ───────────────────────────────────────────────

  private async seedPurchases(items: Item[]): Promise<void> {
    const count = await this.purchaseRepo.count();
    if (count > 0) {
      this.logger.log(`${count} purchases already exist — skipping.`);
      return;
    }

    const suppliers = await this.supplierRepo.find();
    if (suppliers.length === 0) return;

    const today = new Date();
    const purchasesData = [
      {
        purchaseNumber: 'PO-2026-001',
        supplierIdx: 0, // Fresh Foods Co.
        status: PurchaseStatus.RECEIVED,
        date: new Date(today.getTime() - 5 * 86400000),
        notes: 'Weekly vegetable supply',
        lineItems: [
          { itemIdx: 6, qty: 10, price: 45 },  // Tomato Soup supplies
          { itemIdx: 4, qty: 8, price: 75 },    // Paneer Tikka supplies
          { itemIdx: 7, qty: 15, price: 35 },   // Masala Dosa supplies
        ],
      },
      {
        purchaseNumber: 'PO-2026-002',
        supplierIdx: 1, // Spice World Traders
        status: PurchaseStatus.RECEIVED,
        date: new Date(today.getTime() - 3 * 86400000),
        notes: 'Spices and dry goods',
        lineItems: [
          { itemIdx: 0, qty: 20, price: 180 },  // Butter Chicken supplies
          { itemIdx: 2, qty: 15, price: 130 },  // Chicken Biryani supplies
          { itemIdx: 1, qty: 10, price: 70 },   // Dal Makhani supplies
        ],
      },
      {
        purchaseNumber: 'PO-2026-003',
        supplierIdx: 4, // Beverage Hub
        status: PurchaseStatus.ORDERED,
        date: new Date(today.getTime() - 1 * 86400000),
        notes: 'Beverage stock',
        lineItems: [
          { itemIdx: 10, qty: 50, price: 8 },   // Masala Chai supplies
          { itemIdx: 11, qty: 30, price: 35 },  // Cold Coffee supplies
          { itemIdx: 12, qty: 40, price: 12 },  // Fresh Lime Soda supplies
        ],
      },
    ];

    for (const po of purchasesData) {
      const purchaseItems: Partial<PurchaseItem>[] = po.lineItems.map((li) => {
        const item = items[li.itemIdx];
        const totalPrice = li.qty * li.price;
        return {
          itemId: item.id,
          quantity: li.qty,
          unitPrice: li.price,
          gstRate: Number(item.gstRate),
          totalPrice,
        };
      });

      const subtotal = purchaseItems.reduce((s, pi) => s + pi.totalPrice!, 0);
      // 5% GST on average
      const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
      const totalAmount = subtotal + taxAmount;

      const purchase = this.purchaseRepo.create({
        purchaseNumber: po.purchaseNumber,
        supplierId: suppliers[po.supplierIdx].id,
        status: po.status,
        purchaseDate: po.date,
        subtotal,
        discount: 0,
        taxAmount,
        totalAmount,
        notes: po.notes,
        items: purchaseItems as PurchaseItem[],
      });
      await this.purchaseRepo.save(purchase);
    }
    this.logger.log(`Seeded ${purchasesData.length} demo purchase orders.`);
  }

  // ── Invoices ────────────────────────────────────────────────

  private async seedInvoices(items: Item[]): Promise<void> {
    const count = await this.invoiceRepo.count();
    if (count > 0) {
      this.logger.log(`${count} invoices already exist — skipping.`);
      return;
    }

    const today = new Date();
    const invoicesData = [
      {
        invoiceNumber: 'INV-2026-001',
        table: 'Table 7',
        status: InvoiceStatus.COMPLETED,
        date: new Date(today.getTime() - 6 * 86400000),
        payment: PaymentMethod.CARD,
        customerName: 'Rahul Sharma',
        lineItems: [
          { itemIdx: 2, qty: 2 },  // Chicken Biryani
          { itemIdx: 5, qty: 1 },  // Chicken Tikka
          { itemIdx: 13, qty: 3 }, // Naan Bread
        ],
      },
      {
        invoiceNumber: 'INV-2026-002',
        table: 'Table 3',
        status: InvoiceStatus.COMPLETED,
        date: new Date(today.getTime() - 5 * 86400000),
        payment: PaymentMethod.CASH,
        customerName: 'Priya Patel',
        lineItems: [
          { itemIdx: 1, qty: 1 },  // Dal Makhani
          { itemIdx: 7, qty: 2 },  // Masala Dosa
          { itemIdx: 8, qty: 2 },  // Gulab Jamun
        ],
      },
      {
        invoiceNumber: 'INV-2026-003',
        table: 'Table 12',
        status: InvoiceStatus.COMPLETED,
        date: new Date(today.getTime() - 4 * 86400000),
        payment: PaymentMethod.UPI,
        customerName: 'Amit Singh',
        lineItems: [
          { itemIdx: 0, qty: 1 },  // Butter Chicken
          { itemIdx: 1, qty: 1 },  // Dal Makhani
          { itemIdx: 13, qty: 4 }, // Naan Bread
          { itemIdx: 10, qty: 2 }, // Masala Chai
        ],
      },
      {
        invoiceNumber: 'INV-2026-004',
        table: 'Table 5',
        status: InvoiceStatus.COMPLETED,
        date: new Date(today.getTime() - 2 * 86400000),
        payment: PaymentMethod.CARD,
        customerName: 'Neha Gupta',
        lineItems: [
          { itemIdx: 6, qty: 2 },  // Tomato Soup
          { itemIdx: 4, qty: 1 },  // Paneer Tikka
          { itemIdx: 9, qty: 3 },  // Ice Cream
          { itemIdx: 11, qty: 2 }, // Cold Coffee
        ],
      },
      {
        invoiceNumber: 'INV-2026-005',
        table: 'Table 10',
        status: InvoiceStatus.COMPLETED,
        date: new Date(today.getTime() - 1 * 86400000),
        payment: PaymentMethod.UPI,
        customerName: 'Vikram Desai',
        lineItems: [
          { itemIdx: 3, qty: 2 },  // Veg Biryani
          { itemIdx: 8, qty: 1 },  // Gulab Jamun
        ],
      },
      {
        invoiceNumber: 'INV-2026-006',
        table: 'Table 4',
        status: InvoiceStatus.CONFIRMED,
        date: today,
        payment: PaymentMethod.CASH,
        customerName: null,
        lineItems: [
          { itemIdx: 0, qty: 1 },  // Butter Chicken
          { itemIdx: 1, qty: 1 },  // Dal Makhani
          { itemIdx: 13, qty: 2 }, // Naan Bread
          { itemIdx: 11, qty: 1 }, // Cold Coffee
        ],
      },
    ];

    for (const inv of invoicesData) {
      let subtotal = 0;
      let cgstTotal = 0;
      let sgstTotal = 0;

      const invItems: Partial<InvoiceItem>[] = inv.lineItems.map((li) => {
        const item = items[li.itemIdx];
        const unitPrice = item.price;
        const gstRate = Number(item.gstRate);
        const taxableValue = li.qty * unitPrice;
        const cgst = taxableValue * (gstRate / 2 / 100);
        const sgst = taxableValue * (gstRate / 2 / 100);
        const totalAmount = taxableValue + cgst + sgst;

        subtotal += taxableValue;
        cgstTotal += cgst;
        sgstTotal += sgst;

        return {
          itemId: item.id,
          itemName: item.name,
          hsnCode: item.hsnCode,
          quantity: li.qty,
          unitPrice,
          taxableValue,
          gstRate,
          cgstAmount: cgst,
          sgstAmount: sgst,
          totalAmount,
        };
      });

      const taxTotal = cgstTotal + sgstTotal;
      const grandTotal = subtotal + taxTotal;

      const invoice = this.invoiceRepo.create({
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        tableIds: null,
        invoiceDate: inv.date,
        status: inv.status,
        paymentMethod: inv.payment,
        subtotal: Math.round(subtotal * 100) / 100,
        cgstTotal: Math.round(cgstTotal * 100) / 100,
        sgstTotal: Math.round(sgstTotal * 100) / 100,
        igstTotal: 0,
        taxTotal: Math.round(taxTotal * 100) / 100,
        discount: 0,
        roundOff: 0,
        grandTotal: Math.round(grandTotal * 100) / 100,
        items: invItems as InvoiceItem[],
      });
      await this.invoiceRepo.save(invoice);
    }
    this.logger.log(`Seeded ${invoicesData.length} demo invoices.`);
  }

  // ── KOTs ─────────────────────────────────────────────────────

  private async seedKots(items: Item[]): Promise<void> {
    const count = await this.kotRepo.count();
    if (count > 0) {
      this.logger.log(`${count} KOTs already exist — skipping.`);
      return;
    }

    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 86400000);
    const threeDaysAgo = new Date(today.getTime() - 3 * 86400000);

    function makeDate(offsetHours: number, base: Date = today): Date {
      return new Date(base.getTime() + offsetHours * 3600000);
    }

    const kotsData = [
      // ── Today: Active KOTs ──────────────────────────────────
      {
        kotNumber: 'KOT-2026-001', table: 'T5', station: KotStation.MAIN_KITCHEN, status: KotStatus.PREPARING,
        notes: 'Priority — VIP guest',
        startedAt: makeDate(-0.5),
        createdAt: makeDate(-0.75),
        lineItems: [
          { itemIdx: 0, qty: 1, instructions: 'Extra spicy, less oil' },
          { itemIdx: 1, qty: 2, instructions: null },
          { itemIdx: 13, qty: 4, instructions: 'Butter naan' },
        ],
      },
      {
        kotNumber: 'KOT-2026-002', table: 'T7', station: KotStation.TANDOOR, status: KotStatus.PREPARING,
        notes: null,
        startedAt: makeDate(-0.3),
        createdAt: makeDate(-0.5),
        lineItems: [
          { itemIdx: 5, qty: 1, instructions: 'Well done' },
          { itemIdx: 14, qty: 3, instructions: null },
          { itemIdx: 4, qty: 1, instructions: 'Extra paneer' },
        ],
      },
      {
        kotNumber: 'KOT-2026-003', table: 'T12', station: KotStation.BEVERAGES, status: KotStatus.PENDING,
        notes: 'Birthday table — add candle',
        createdAt: makeDate(-0.1),
        lineItems: [
          { itemIdx: 11, qty: 2, instructions: 'Extra ice' },
          { itemIdx: 10, qty: 1, instructions: 'Less sugar' },
          { itemIdx: 12, qty: 1, instructions: 'With salt' },
        ],
      },
      {
        kotNumber: 'KOT-2026-004', table: 'T3', station: KotStation.SNACKS, status: KotStatus.PREPARING,
        notes: null,
        startedAt: makeDate(-0.4),
        createdAt: makeDate(-0.6),
        lineItems: [
          { itemIdx: 7, qty: 2, instructions: 'Crispy' },
          { itemIdx: 6, qty: 1, instructions: null },
        ],
      },
      {
        kotNumber: 'KOT-2026-005', table: 'T9', station: KotStation.DESSERTS, status: KotStatus.PENDING,
        notes: 'Serve after main course',
        createdAt: makeDate(-0.15),
        lineItems: [
          { itemIdx: 8, qty: 2, instructions: 'With extra rabdi' },
          { itemIdx: 9, qty: 1, instructions: 'Chocolate flavor' },
        ],
      },
      {
        kotNumber: 'KOT-2026-006', table: 'T2', station: KotStation.MAIN_KITCHEN, status: KotStatus.PREPARING,
        notes: 'Jain food — no onion no garlic',
        startedAt: makeDate(-0.2),
        createdAt: makeDate(-0.45),
        lineItems: [
          { itemIdx: 3, qty: 1, instructions: 'No onion, no garlic' },
          { itemIdx: 2, qty: 1, instructions: null },
          { itemIdx: 14, qty: 2, instructions: null },
        ],
      },

      // ── Today: Completed KOTs ───────────────────────────────
      {
        kotNumber: 'KOT-2026-007', table: 'T1', station: KotStation.MAIN_KITCHEN, status: KotStatus.SERVED,
        notes: null,
        startedAt: makeDate(-3),
        completedAt: makeDate(-2),
        servedAt: makeDate(-1.8),
        createdAt: makeDate(-3.2),
        lineItems: [
          { itemIdx: 0, qty: 1, instructions: null },
          { itemIdx: 1, qty: 1, instructions: null },
        ],
      },
      {
        kotNumber: 'KOT-2026-008', table: 'T4', station: KotStation.TANDOOR, status: KotStatus.SERVED,
        notes: null,
        startedAt: makeDate(-2.5),
        completedAt: makeDate(-1.5),
        servedAt: makeDate(-1.3),
        createdAt: makeDate(-2.7),
        lineItems: [
          { itemIdx: 5, qty: 2, instructions: 'Medium rare' },
          { itemIdx: 14, qty: 2, instructions: null },
        ],
      },
      {
        kotNumber: 'KOT-2026-009', table: 'T6', station: KotStation.BEVERAGES, status: KotStatus.READY,
        notes: null,
        startedAt: makeDate(-0.6),
        completedAt: makeDate(-0.1),
        createdAt: makeDate(-0.8),
        lineItems: [
          { itemIdx: 11, qty: 3, instructions: null },
          { itemIdx: 10, qty: 2, instructions: 'Ginger chai' },
        ],
      },

      // ── Yesterday: Completed KOTs ───────────────────────────
      {
        kotNumber: 'KOT-2026-010', table: 'T8', station: KotStation.MAIN_KITCHEN, status: KotStatus.SERVED,
        notes: null,
        startedAt: makeDate(-1.5, yesterday),
        completedAt: makeDate(-0.5, yesterday),
        servedAt: makeDate(-0.3, yesterday),
        createdAt: makeDate(-1.8, yesterday),
        lineItems: [
          { itemIdx: 0, qty: 2, instructions: null },
          { itemIdx: 1, qty: 1, instructions: null },
          { itemIdx: 13, qty: 2, instructions: null },
        ],
      },
      {
        kotNumber: 'KOT-2026-011', table: 'T10', station: KotStation.SNACKS, status: KotStatus.SERVED,
        notes: 'Office party',
        startedAt: makeDate(-0.8, yesterday),
        completedAt: makeDate(-0.1, yesterday),
        servedAt: makeDate(0, yesterday),
        createdAt: makeDate(-1, yesterday),
        lineItems: [
          { itemIdx: 7, qty: 5, instructions: null },
          { itemIdx: 6, qty: 3, instructions: null },
          { itemIdx: 4, qty: 2, instructions: null },
        ],
      },
      {
        kotNumber: 'KOT-2026-012', table: 'T11', station: KotStation.DESSERTS, status: KotStatus.SERVED,
        notes: null,
        startedAt: makeDate(-1, yesterday),
        completedAt: makeDate(-0.3, yesterday),
        servedAt: makeDate(-0.1, yesterday),
        createdAt: makeDate(-1.2, yesterday),
        lineItems: [
          { itemIdx: 8, qty: 1, instructions: null },
          { itemIdx: 9, qty: 2, instructions: 'Vanilla' },
        ],
      },

      // ── 2 days ago: Mixed ───────────────────────────────────
      {
        kotNumber: 'KOT-2026-013', table: 'T5', station: KotStation.MAIN_KITCHEN, status: KotStatus.CANCELLED,
        notes: 'Customer changed order',
        startedAt: makeDate(-2, twoDaysAgo),
        createdAt: makeDate(-2.3, twoDaysAgo),
        lineItems: [
          { itemIdx: 0, qty: 1, instructions: null },
          { itemIdx: 2, qty: 1, instructions: null },
        ],
      },
      {
        kotNumber: 'KOT-2026-014', table: 'T7', station: KotStation.TANDOOR, status: KotStatus.SERVED,
        notes: null,
        startedAt: makeDate(-1, twoDaysAgo),
        completedAt: makeDate(-0.2, twoDaysAgo),
        servedAt: makeDate(0, twoDaysAgo),
        createdAt: makeDate(-1.3, twoDaysAgo),
        lineItems: [
          { itemIdx: 5, qty: 2, instructions: 'Extra masala' },
          { itemIdx: 14, qty: 4, instructions: null },
        ],
      },

      // ── 3 days ago: Completed ───────────────────────────────
      {
        kotNumber: 'KOT-2026-015', table: 'T1,T2', station: KotStation.BEVERAGES, status: KotStatus.SERVED,
        notes: 'Large party — 10 guests',
        startedAt: makeDate(-1.5, threeDaysAgo),
        completedAt: makeDate(-0.5, threeDaysAgo),
        servedAt: makeDate(-0.3, threeDaysAgo),
        createdAt: makeDate(-2, threeDaysAgo),
        lineItems: [
          { itemIdx: 11, qty: 4, instructions: null },
          { itemIdx: 10, qty: 3, instructions: null },
          { itemIdx: 12, qty: 2, instructions: null },
        ],
      },
    ];

    for (const kotData of kotsData) {
      const kotItems: Partial<KotItem>[] = kotData.lineItems.map((li) => {
        const item = items[li.itemIdx];
        let itemStatus = KotStatus.PENDING;
        if (kotData.status === KotStatus.PREPARING) {
          itemStatus = KotStatus.PREPARING;
        } else if (kotData.status === KotStatus.READY || kotData.status === KotStatus.SERVED) {
          itemStatus = KotStatus.READY;
        } else if (kotData.status === KotStatus.CANCELLED) {
          itemStatus = KotStatus.CANCELLED;
        }
        return {
          itemId: item.id,
          itemName: item.name,
          quantity: li.qty,
          instructions: li.instructions || null,
          status: itemStatus,
        };
      });

      const tableIds = kotData.table ? [kotData.table].flatMap(t => t.split(',')) : null;

      const kot = this.kotRepo.create({
        kotNumber: kotData.kotNumber,
        tableIds,
        station: kotData.station,
        status: kotData.status,
        notes: kotData.notes || null,
        startedAt: kotData.startedAt || null,
        completedAt: kotData.completedAt || null,
        servedAt: kotData.servedAt || null,
        items: kotItems as KotItem[],
      });
      const saved = await this.kotRepo.save(kot);
      // Backdate createdAt for historical KOTs
      if (kotData.createdAt) {
        const dateStr = kotData.createdAt.toISOString();
        await this.kotRepo.createQueryBuilder()
          .update()
          .set({ createdAt: kotData.createdAt } as any)
          .where('id = :id', { id: saved.id })
          .execute();
      }
    }
    this.logger.log(`Seeded ${kotsData.length} demo KOTs.`);
  }

  // ── Ledger Entries ──────────────────────────────────────────

  private async seedLedgerEntries(): Promise<void> {
    const count = await this.ledgerEntryRepo.count();
    if (count > 0) {
      this.logger.log(`${count} ledger entries already exist — skipping.`);
      return;
    }

    const accounts = await this.ledgerRepo.find();
    const cashAccount = accounts.find((a) => a.name === 'Cash Account');
    const salesAccount = accounts.find((a) => a.name === 'Sales Revenue');
    const gstPayable = accounts.find((a) => a.name === 'GST Payable');
    const purchaseAccount = accounts.find((a) => a.name === 'Purchase Account');
    const gstInput = accounts.find((a) => a.name === 'GST Input Credit');

    if (!cashAccount || !salesAccount || !gstPayable) return;

    const invoices = await this.invoiceRepo.find();
    const purchases = await this.purchaseRepo.find();

    // Sales revenue entries
    for (const inv of invoices) {
      const entryDate = inv.invoiceDate;

      // Debit cash account (money received)
      const cashOpening = Number(cashAccount.openingBalance) || 0;
      await this.ledgerEntryRepo.save(
        this.ledgerEntryRepo.create({
          accountId: cashAccount.id,
          entryDate,
          type: LedgerEntryType.DEBIT,
          amount: inv.grandTotal,
          description: `Invoice ${inv.invoiceNumber} - Takeaway`,
          category: LedgerCategory.SALES,
          reference: inv.invoiceNumber,
          balanceAfter: cashOpening + inv.grandTotal,
        }),
      );

      // Credit sales revenue
      await this.ledgerEntryRepo.save(
        this.ledgerEntryRepo.create({
          accountId: salesAccount.id,
          entryDate,
          type: LedgerEntryType.CREDIT,
          amount: inv.subtotal,
          description: `Revenue from ${inv.invoiceNumber}`,
          category: LedgerCategory.SALES,
          reference: inv.invoiceNumber,
          balanceAfter: inv.subtotal,
        }),
      );

      // Credit GST payable
      if (inv.taxTotal > 0 && gstPayable) {
        await this.ledgerEntryRepo.save(
          this.ledgerEntryRepo.create({
            accountId: gstPayable.id,
            entryDate,
            type: LedgerEntryType.CREDIT,
            amount: inv.taxTotal,
            description: `GST collected on ${inv.invoiceNumber}`,
            category: LedgerCategory.TAX,
            reference: inv.invoiceNumber,
            balanceAfter: inv.taxTotal,
          }),
        );
      }
    }

    // Purchase expense entries
    for (const po of purchases) {
      if (!purchaseAccount) continue;

      await this.ledgerEntryRepo.save(
        this.ledgerEntryRepo.create({
          accountId: purchaseAccount.id,
          entryDate: po.purchaseDate,
          type: LedgerEntryType.DEBIT,
          amount: po.subtotal,
          description: `Purchase ${po.purchaseNumber}`,
          category: LedgerCategory.PURCHASE,
          reference: po.purchaseNumber,
          balanceAfter: po.subtotal,
        }),
      );

      // GST input credit
      if (po.taxAmount > 0 && gstInput) {
        await this.ledgerEntryRepo.save(
          this.ledgerEntryRepo.create({
            accountId: gstInput.id,
            entryDate: po.purchaseDate,
            type: LedgerEntryType.DEBIT,
            amount: po.taxAmount,
            description: `GST input on ${po.purchaseNumber}`,
            category: LedgerCategory.TAX,
            reference: po.purchaseNumber,
            balanceAfter: po.taxAmount,
          }),
        );
      }
    }

    const totalEntries = invoices.length * 2 + purchases.length + (invoices.filter((i) => i.taxTotal > 0).length) + (purchases.filter((p) => p.taxAmount > 0).length);
    this.logger.log(`Seeded ${totalEntries} demo ledger entries.`);
  }

  // ── Ledger accounts ─────────────────────────────────────────

  private async seedLedgerAccounts(): Promise<void> {
    const count = await this.ledgerRepo.count();
    if (count > 0) {
      this.logger.log(`${count} ledger accounts already exist — skipping.`);
      return;
    }

    for (const data of DEMO_LEDGER_ACCOUNTS) {
      const account = this.ledgerRepo.create({
        ...data,
        currentBalance: data.openingBalance || 0,
        isActive: true,
      } as LedgerAccount);
      await this.ledgerRepo.save(account);
    }
    this.logger.log(`Seeded ${DEMO_LEDGER_ACCOUNTS.length} ledger accounts.`);
  }

  // ── Storage Unit ──────────────────────────────────────────────

  private async seedStorageUnit(): Promise<void> {
    const count = await this.storageUnitRepo.count();
    if (count > 0) {
      this.logger.log(`${count} storage units already exist — skipping.`);
      return;
    }

    const mainStore = this.storageUnitRepo.create({
      name: 'Main Store',
      code: 'MAIN',
      type: StorageUnitType.STORE,
      isDefault: true,
      isActive: true,
    });
    await this.storageUnitRepo.save(mainStore);
    this.logger.log('Seeded 1 default storage unit (Main Store).');
  }

  // ── Units ───────────────────────────────────────────────────

  private async seedUnits(): Promise<void> {
    const count = await this.unitRepo.count();
    if (count > 0) {
      this.logger.log(`${count} units already exist — skipping.`);
      return;
    }

    const unitDefs = [
      // Weight
      { code: 'kg', name: 'Kilogram', unitType: UnitType.WEIGHT, isBaseUnit: true },
      { code: 'gram', name: 'Gram', unitType: UnitType.WEIGHT, isBaseUnit: false },
      // Volume
      { code: 'litre', name: 'Litre', unitType: UnitType.VOLUME, isBaseUnit: true },
      { code: 'ml', name: 'Millilitre', unitType: UnitType.VOLUME, isBaseUnit: false },
      // Count
      { code: 'piece', name: 'Piece', unitType: UnitType.COUNT, isBaseUnit: true },
      { code: 'dozen', name: 'Dozen', unitType: UnitType.COUNT, isBaseUnit: false },
      // Serving units (count-based, not base)
      { code: 'plate', name: 'Plate', unitType: UnitType.COUNT, isBaseUnit: false },
      { code: 'bowl', name: 'Bowl', unitType: UnitType.COUNT, isBaseUnit: false },
      { code: 'cup', name: 'Cup', unitType: UnitType.COUNT, isBaseUnit: false },
      { code: 'glass', name: 'Glass', unitType: UnitType.COUNT, isBaseUnit: false },
      { code: 'bottle', name: 'Bottle', unitType: UnitType.COUNT, isBaseUnit: false },
      { code: 'box', name: 'Box', unitType: UnitType.COUNT, isBaseUnit: false },
      { code: 'packet', name: 'Packet', unitType: UnitType.COUNT, isBaseUnit: false },
    ];

    for (const u of unitDefs) {
      const unit = this.unitRepo.create({ ...u, isActive: true });
      await this.unitRepo.save(unit);
    }
    this.logger.log(`Seeded ${unitDefs.length} units (${new Set(unitDefs.map((u) => u.unitType)).size} types).`);
  }

  private async seedUnitConversions(): Promise<void> {
    const count = await this.conversionRepo.count();
    if (count > 0) {
      this.logger.log(`${count} unit conversions already exist — skipping.`);
      return;
    }

    const units = await this.unitRepo.find();
    const byCode = new Map(units.map((u) => [u.code, u.id]));

    const get = (code: string) => {
      const id = byCode.get(code);
      if (!id) throw new Error(`Unit code "${code}" not found in seed`);
      return id;
    };

    const conversions = [
      // Global weight: kg <-> gram
      { itemId: null, fromUnitId: get('kg'), toUnitId: get('gram'), factor: 1000 },
      { itemId: null, fromUnitId: get('gram'), toUnitId: get('kg'), factor: 0.001 },
      // Global volume: litre <-> ml
      { itemId: null, fromUnitId: get('litre'), toUnitId: get('ml'), factor: 1000 },
      { itemId: null, fromUnitId: get('ml'), toUnitId: get('litre'), factor: 0.001 },
      // Global count: dozen <-> piece
      { itemId: null, fromUnitId: get('dozen'), toUnitId: get('piece'), factor: 12 },
      { itemId: null, fromUnitId: get('piece'), toUnitId: get('dozen'), factor: 1 / 12 },
    ];

    for (const conv of conversions) {
      const entity = this.conversionRepo.create(conv);
      await this.conversionRepo.save(entity);
    }
    this.logger.log(`Seeded ${conversions.length} unit conversions (${conversions.filter((c) => !c.itemId).length} global, ${conversions.filter((c) => c.itemId).length} item-specific).`);
  }

  // ── Zones ───────────────────────────────────────────────────

  private async seedZones(): Promise<void> {
    const count = await this.zoneRepo.count();
    if (count > 0) {
      this.logger.log(`${count} zones already exist — skipping.`);
      return;
    }

    const zones = [
      { id: 'b0000001-0000-0000-0000-000000000001', name: 'Main Hall', description: 'Main dining area with family seating', floor: 0, isActive: true },
      { id: 'b0000001-0000-0000-0000-000000000002', name: 'AC Lounge', description: 'Air-conditioned premium seating section', floor: 0, isActive: true },
      { id: 'b0000001-0000-0000-0000-000000000003', name: 'Terrace', description: 'Open-air terrace with garden views', floor: 1, isActive: true },
      { id: 'b0000001-0000-0000-0000-000000000004', name: 'Private Room', description: 'VIP private dining room for special events', floor: 2, isActive: true },
    ];

    for (const z of zones) {
      const zone = this.zoneRepo.create(z);
      await this.zoneRepo.save(zone);
    }
    this.logger.log(`Seeded ${zones.length} demo dining zones.`);
  }

  // ── Tables ──────────────────────────────────────────────────

  private async seedTables(): Promise<void> {
    const count = await this.tableRepo.count();
    if (count > 0) {
      this.logger.log(`${count} tables already exist — skipping.`);
      return;
    }

    const zoneId1 = 'b0000001-0000-0000-0000-000000000001'; // Main Hall
    const zoneId2 = 'b0000001-0000-0000-0000-000000000002'; // AC Lounge
    const zoneId3 = 'b0000001-0000-0000-0000-000000000003'; // Terrace
    const zoneId4 = 'b0000001-0000-0000-0000-000000000004'; // Private Room

    const tables: Array<Partial<Table>> = [
      // ── Main Hall (6 tables) ──
      { zoneId: zoneId1, label: 'T1', capacity: 4, category: TableCategory.WALK_IN, status: TableStatus.AVAILABLE, posX: 40, posY: 30 },
      { zoneId: zoneId1, label: 'T2', capacity: 4, category: TableCategory.WALK_IN, status: TableStatus.OCCUPIED, posX: 160, posY: 30 },
      { zoneId: zoneId1, label: 'T3', capacity: 6, category: TableCategory.WALK_IN, status: TableStatus.OCCUPIED, posX: 280, posY: 30 },
      { zoneId: zoneId1, label: 'T4', capacity: 2, category: TableCategory.WALK_IN, status: TableStatus.AVAILABLE, posX: 40, posY: 150 },
      { zoneId: zoneId1, label: 'T5', capacity: 4, category: TableCategory.FLEXIBLE, status: TableStatus.AVAILABLE, posX: 160, posY: 150 },
      { zoneId: zoneId1, label: 'T6', capacity: 6, category: TableCategory.WALK_IN, status: TableStatus.BOOKED, posX: 280, posY: 150 },

      // ── AC Lounge (5 tables) ──
      { zoneId: zoneId2, label: 'A1', capacity: 2, category: TableCategory.ONLINE, status: TableStatus.AVAILABLE, posX: 40, posY: 30 },
      { zoneId: zoneId2, label: 'A2', capacity: 2, category: TableCategory.ONLINE, status: TableStatus.OCCUPIED, posX: 160, posY: 30 },
      { zoneId: zoneId2, label: 'A3', capacity: 4, category: TableCategory.ONLINE, status: TableStatus.AVAILABLE, posX: 280, posY: 30 },
      { zoneId: zoneId2, label: 'A4', capacity: 4, category: TableCategory.ONLINE, status: TableStatus.BOOKED, posX: 40, posY: 150 },
      { zoneId: zoneId2, label: 'A5', capacity: 4, category: TableCategory.FLEXIBLE, status: TableStatus.AVAILABLE, posX: 160, posY: 150 },

      // ── Terrace (4 tables) ──
      { zoneId: zoneId3, label: 'TR1', capacity: 4, category: TableCategory.WALK_IN, status: TableStatus.AVAILABLE, posX: 40, posY: 30 },
      { zoneId: zoneId3, label: 'TR2', capacity: 4, category: TableCategory.WALK_IN, status: TableStatus.OCCUPIED, posX: 160, posY: 30 },
      { zoneId: zoneId3, label: 'TR3', capacity: 2, category: TableCategory.WALK_IN, status: TableStatus.AVAILABLE, posX: 40, posY: 150 },
      { zoneId: zoneId3, label: 'TR4', capacity: 6, category: TableCategory.FLEXIBLE, status: TableStatus.AVAILABLE, posX: 160, posY: 150 },

      // ── Private Room (2 tables) ──
      { zoneId: zoneId4, label: 'P1', capacity: 8, category: TableCategory.WALK_IN, status: TableStatus.AVAILABLE, posX: 80, posY: 60 },
      { zoneId: zoneId4, label: 'P2', capacity: 10, category: TableCategory.WALK_IN, status: TableStatus.BOOKED, posX: 80, posY: 180 },
    ];

    for (const t of tables) {
      const table = this.tableRepo.create(t as Table);
      await this.tableRepo.save(table);
    }
    this.logger.log(`Seeded ${tables.length} demo tables across 4 zones.`);
  }

  // ── Second Storage Unit (Module 2) ─────────────────────────

  private async seedSecondStorageUnit(): Promise<void> {
    const existing = await this.storageUnitRepo.findOne({ where: { code: 'KITCHEN' } });
    if (existing) {
      this.logger.log('Second storage unit already exists — skipping.');
      return;
    }

    const kitchen = this.storageUnitRepo.create({
      name: 'Kitchen Cold Room',
      code: 'KITCHEN',
      type: StorageUnitType.COLD_STORAGE,
      isDefault: false,
      isActive: true,
    });
    await this.storageUnitRepo.save(kitchen);
    this.logger.log('Seeded second storage unit (Kitchen Cold Room).');
  }

  // ── Stock Batches (Module 6) ────────────────────────────────

  private async seedBatches(items: Item[]): Promise<void> {
    const count = await this.batchRepo.count();
    if (count > 0) {
      this.logger.log(`${count} stock batches already exist — skipping.`);
      return;
    }

    const defaultSu = await this.storageUnitRepo.findOne({ where: { isDefault: true } });
    if (!defaultSu) return;

    const today = new Date();
    let addedCount = 0;

    for (const item of items) {
      if (item.shelfLifeDays && item.shelfLifeDays > 0) {
        const receivedDate = new Date(today.getTime() - 3 * 86400000);
        const expiryDate = new Date(receivedDate.getTime() + item.shelfLifeDays * 86400000);
        const batchNumber = `B-SEED-${item.sku}`;

        await this.batchRepo.save(
          this.batchRepo.create({
            itemId: item.id,
            storageUnitId: defaultSu.id,
            batchNumber,
            quantityReceived: 50,
            quantityRemaining: 50,
            unitCost: item.costPrice || 0,
            receivedDate,
            expiryDate,
            status: BatchStatus.ACTIVE,
          }),
        );
        addedCount++;
      }
    }

    if (addedCount > 0) {
      this.logger.log(`Seeded ${addedCount} stock batches for items with shelf life.`);
    }
  }

  // ── Customers ───────────────────────────────────────────────

  private async seedCustomers(): Promise<void> {
    const count = await this.customerRepo.count();
    if (count > 0) {
      this.logger.log(`${count} customers already exist — skipping.`);
      return;
    }

    const customers = [
      { name: 'Rahul Sharma', phone: '+91 99999 10001', email: 'rahul@email.com', customerType: 'regular' },
      { name: 'Priya Patel', phone: '+91 99999 10002', email: 'priya@email.com', customerType: 'regular' },
      { name: 'Amit Singh', phone: '+91 99999 10003', email: 'amit@email.com', customerType: 'corporate' },
      { name: 'Neha Gupta', phone: '+91 99999 10004', email: 'neha@email.com', customerType: 'regular' },
      { name: 'Vikram Desai', phone: '+91 99999 10005', email: 'vikram@email.com', customerType: 'corporate' },
    ];

    for (const c of customers) {
      await this.customerRepo.save(this.customerRepo.create(c));
    }
    this.logger.log(`Seeded ${customers.length} demo customers.`);
  }

  // ── Price Levels (Module) ───────────────────────────────────

  private async seedPriceLevels(items: Item[]): Promise<void> {
    const count = await this.priceLevelRepo.count();
    if (count > 0) {
      this.logger.log(`${count} price levels already exist — skipping.`);
      return;
    }

    // Create 3 price levels
    const standard = await this.priceLevelRepo.save(
      this.priceLevelRepo.create({
        name: 'Standard', code: 'STD', description: 'Standard menu pricing',
        isDefault: true, isActive: true,
      }),
    );
    const corporate = await this.priceLevelRepo.save(
      this.priceLevelRepo.create({
        name: 'Corporate', code: 'CORP', description: 'Corporate/bulk discount pricing',
        isDefault: false, isActive: true,
      }),
    );
    const premium = await this.priceLevelRepo.save(
      this.priceLevelRepo.create({
        name: 'Premium', code: 'PRM', description: 'Premium pricing for special events',
        isDefault: false, isActive: true,
      }),
    );

    // Item price mappings: corporate = 10% off, premium = 25% premium
    let mappingCount = 0;
    for (const item of items) {
      // Corporate pricing: 10% off
      await this.itemPriceLevelRepo.save(
        this.itemPriceLevelRepo.create({
          itemId: item.id, priceLevelId: corporate.id,
          price: Math.round(item.price * 0.9 * 100) / 100,
        }),
      );
      // Premium pricing: 25% surcharge
      await this.itemPriceLevelRepo.save(
        this.itemPriceLevelRepo.create({
          itemId: item.id, priceLevelId: premium.id,
          price: Math.round(item.price * 1.25 * 100) / 100,
        }),
      );
      mappingCount += 2;
    }

    this.logger.log(`Seeded 3 price levels with ${mappingCount} item price mappings.`);
  }

  // ── Recipes (Module) ────────────────────────────────────────

  private async seedRecipes(items: Item[]): Promise<void> {
    const count = await this.recipeRepo.count();
    if (count > 0) {
      this.logger.log(`${count} recipes already exist — skipping.`);
      return;
    }

    const itemByName = new Map(items.map((i) => [i.name, i]));

    // Helper to find item by name
    const get = (name: string) => {
      const item = itemByName.get(name);
      if (!item) throw new Error(`Item "${name}" not found`);
      return item;
    };

    interface RecipeDef {
      outputItemName: string
      yieldQty: number
      ingredients: { name: string; qty: number }[]
    }

    const recipeDefs: RecipeDef[] = [
      {
        outputItemName: 'Butter Chicken',
        yieldQty: 1,
        ingredients: [
          { name: 'Chicken Tikka', qty: 0.25 },
          { name: 'Naan Bread', qty: 2 },
        ],
      },
      {
        outputItemName: 'Dal Makhani',
        yieldQty: 1,
        ingredients: [
          { name: 'Naan Bread', qty: 2 },
        ],
      },
      {
        outputItemName: 'Chicken Biryani',
        yieldQty: 1,
        ingredients: [
          { name: 'Chicken Tikka', qty: 0.2 },
          { name: 'Tandoori Roti', qty: 1 },
        ],
      },
      {
        outputItemName: 'Masala Dosa',
        yieldQty: 1,
        ingredients: [], // No raw ingredient tracked in inventory
      },
      {
        outputItemName: 'Cold Coffee',
        yieldQty: 1,
        ingredients: [
          { name: 'Ice Cream', qty: 1 },
        ],
      },
    ];

    for (const def of recipeDefs) {
      const outputItem = get(def.outputItemName);
      const recipe = await this.recipeRepo.save(
        this.recipeRepo.create({
          outputItemId: outputItem.id,
          yieldQuantity: def.yieldQty,
          yieldUnit: 'plate' as any,
        }),
      );

      for (const ing of def.ingredients) {
        const componentItem = get(ing.name);
        await this.ingredientRepo.save(
          this.ingredientRepo.create({
            recipeId: recipe.id,
            componentItemId: componentItem.id,
            quantity: ing.qty,
            unit: 'piece' as any,
          }),
        );
      }
    }

    this.logger.log(`Seeded ${recipeDefs.length} demo recipes.`);
  }

  // ── Reservations ────────────────────────────────────────────

  private async seedReservations(): Promise<void> {
    const count = await this.reservationRepo.count();
    if (count > 0) {
      this.logger.log(`${count} reservations already exist — skipping.`);
      return;
    }

    const today = new Date();
    const zones = await this.zoneRepo.find();
    const tables = await this.tableRepo.find();

    const zoneByName = new Map(zones.map((z) => [z.name, z.id]));
    const tableByLabel = new Map(tables.map((t) => [t.label, t.id]));

    const getZoneId = (name: string) => zoneByName.get(name) || null;
    const getTableId = (label: string) => tableByLabel.get(label) || null;

    const reservations = [
      {
        customerName: 'Ananya Reddy', customerPhone: '+91 99888 70001', partySize: 4,
        scheduledFor: new Date(today.getTime() + 1 * 86400000 + 19 * 3600000), // tomorrow 7pm
        status: ReservationStatus.CONFIRMED, source: ReservationSource.ONLINE,
        zoneId: getZoneId('Main Hall'), tableId: getTableId('T1'),
        notes: 'Anniversary dinner',
      },
      {
        customerName: 'Ravi Kumar', customerPhone: '+91 99888 70002', partySize: 6,
        scheduledFor: new Date(today.getTime() + 1 * 86400000 + 20 * 3600000),
        status: ReservationStatus.CONFIRMED, source: ReservationSource.PHONE,
        zoneId: getZoneId('Main Hall'), tableId: getTableId('T6'),
        notes: 'Birthday celebration',
      },
      {
        customerName: 'Sneha Joshi', customerPhone: '+91 99888 70003', partySize: 2,
        scheduledFor: new Date(today.getTime() + 2 * 86400000 + 18 * 3600000),
        status: ReservationStatus.PENDING, source: ReservationSource.ONLINE,
        zoneId: getZoneId('AC Lounge'), tableId: getTableId('A1'),
        notes: null,
      },
      {
        customerName: 'Deepak Verma', customerPhone: '+91 99888 70004', partySize: 8,
        scheduledFor: new Date(today.getTime() - 1 * 86400000 + 19 * 3600000), // yesterday 7pm
        status: ReservationStatus.COMPLETED, source: ReservationSource.WALK_IN,
        zoneId: getZoneId('Private Room'), tableId: getTableId('P1'),
        notes: 'Corporate dinner',
      },
      {
        customerName: 'Kavita Nair', customerPhone: '+91 99888 70005', partySize: 3,
        scheduledFor: new Date(today.getTime() - 2 * 86400000 + 19 * 3600000),
        status: ReservationStatus.CANCELLED, source: ReservationSource.ONLINE,
        zoneId: getZoneId('Terrace'), tableId: null,
        notes: 'Cancelled due to rain',
      },
    ];

    for (const r of reservations) {
      await this.reservationRepo.save(this.reservationRepo.create(r));
    }
    this.logger.log(`Seeded ${reservations.length} demo reservations.`);
  }

  // ── Stock Counts (Module 8) ─────────────────────────────────

  private async seedStockCounts(items: Item[]): Promise<void> {
    const count = await this.stockCountRepo.count();
    if (count > 0) {
      this.logger.log(`${count} stock counts already exist — skipping.`);
      return;
    }

    const defaultSu = await this.storageUnitRepo.findOne({ where: { isDefault: true } });
    if (!defaultSu) return;

    // Pick a few items for the count
    const countItems = items.slice(0, 4);

    const stockCount = await this.stockCountRepo.save(
      this.stockCountRepo.create({
        storageUnitId: defaultSu.id,
        countDate: new Date(),
        status: StockCountStatus.COMPLETED,
        notes: 'End-of-month physical count',
      }),
    );

    // Create lines with deliberate variances
    const variances = [0, -3, 2, 0]; // exact, under-count, over-count, exact
    for (let i = 0; i < countItems.length; i++) {
      const item = countItems[i];
      const systemQty = 50;
      const countedQty = systemQty + variances[i];

      await this.stockCountLineRepo.save(
        this.stockCountLineRepo.create({
          stockCountId: stockCount.id,
          itemId: item.id,
          systemQuantity: systemQty,
          countedQuantity: countedQty,
          variance: variances[i],
          notes: variances[i] !== 0 ? (variances[i] > 0 ? 'Found extra stock' : 'Missing stock') : 'Accurate',
        }),
      );
    }

    this.logger.log(`Seeded 1 completed stock count with ${countItems.length} lines (2 variances).`);
  }

  // ── Item-Supplier Links ────────────────────────────────────

  private async seedItemSuppliers(items: Item[]): Promise<void> {
    const count = await this.itemSupplierRepo.count();
    if (count > 0) {
      this.logger.log(`${count} item-supplier links already exist — skipping.`);
      return;
    }

    const suppliers = await this.supplierRepo.find();
    if (suppliers.length === 0) return;

    const units = await this.unitRepo.find();
    const unitByCode = new Map(units.map((u) => [u.code, u.id]));
    const getUnitId = (code: string) => unitByCode.get(code) || null;

    const itemByName = new Map(items.map((i) => [i.name, i]));
    const supplierByName = new Map(suppliers.map((s) => [s.name, s.id]));

    const links: Array<Partial<ItemSupplier>> = [
      // Butter Chicken supplies
      { itemId: itemByName.get('Butter Chicken')!.id, supplierId: supplierByName.get('Spice World Traders')!, unitPrice: 180, unitId: getUnitId('kg'), leadTimeDays: 2, isPreferred: true, minOrderQty: 5, supplierSku: 'SW-BC-001' },
      { itemId: itemByName.get('Butter Chicken')!.id, supplierId: supplierByName.get('Fresh Foods Co.')!, unitPrice: 195, unitId: getUnitId('piece'), leadTimeDays: 3, isPreferred: false, minOrderQty: 10, supplierSku: 'FF-BC-202' },
      // Dal Makhani
      { itemId: itemByName.get('Dal Makhani')!.id, supplierId: supplierByName.get('Fresh Foods Co.')!, unitPrice: 70, unitId: getUnitId('kg'), leadTimeDays: 1, isPreferred: true, minOrderQty: 3, supplierSku: 'FF-DM-001' },
      // Chicken Tikka
      { itemId: itemByName.get('Chicken Tikka')!.id, supplierId: supplierByName.get('Spice World Traders')!, unitPrice: 110, unitId: getUnitId('kg'), leadTimeDays: 2, isPreferred: true, minOrderQty: 5, supplierSku: 'SW-CT-003' },
      // Paneer Tikka
      { itemId: itemByName.get('Paneer Tikka')!.id, supplierId: supplierByName.get('Dairy Best Supplies')!, unitPrice: 75, unitId: getUnitId('kg'), leadTimeDays: 1, isPreferred: true, minOrderQty: 2, supplierSku: 'DB-PT-001' },
      // Ice Cream
      { itemId: itemByName.get('Ice Cream')!.id, supplierId: supplierByName.get('Dairy Best Supplies')!, unitPrice: 35, unitId: getUnitId('litre'), leadTimeDays: 2, isPreferred: true, minOrderQty: 10, supplierSku: 'DB-IC-123' },
      // Masala Chai
      { itemId: itemByName.get('Masala Chai')!.id, supplierId: supplierByName.get('Beverage Hub')!, unitPrice: 8, unitId: getUnitId('packet'), leadTimeDays: 3, isPreferred: true, minOrderQty: 20, supplierSku: 'BH-MC-045' },
      // Fresh Lime Soda
      { itemId: itemByName.get('Fresh Lime Soda')!.id, supplierId: supplierByName.get('Beverage Hub')!, unitPrice: 12, unitId: getUnitId('bottle'), leadTimeDays: 3, isPreferred: true, minOrderQty: 24, supplierSku: 'BH-FLS-012' },
      // Cold Coffee
      { itemId: itemByName.get('Cold Coffee')!.id, supplierId: supplierByName.get('Beverage Hub')!, unitPrice: 35, unitId: getUnitId('litre'), leadTimeDays: 4, isPreferred: false, minOrderQty: 5, supplierSku: 'BH-CC-089' },
      { itemId: itemByName.get('Cold Coffee')!.id, supplierId: supplierByName.get('Organic Harvest')!, unitPrice: 32, unitId: getUnitId('litre'), leadTimeDays: 5, isPreferred: true, minOrderQty: 5, supplierSku: 'OH-CC-202' },
      // Veg Biryani
      { itemId: itemByName.get('Veg Biryani')!.id, supplierId: supplierByName.get('Organic Harvest')!, unitPrice: 90, unitId: getUnitId('kg'), leadTimeDays: 2, isPreferred: true, minOrderQty: 5, supplierSku: 'OH-VB-001' },
      // Tomato Soup
      { itemId: itemByName.get('Tomato Soup')!.id, supplierId: supplierByName.get('Fresh Foods Co.')!, unitPrice: 45, unitId: getUnitId('litre'), leadTimeDays: 1, isPreferred: true, minOrderQty: 3, supplierSku: 'FF-TS-005' },
    ];

    for (const link of links) {
      await this.itemSupplierRepo.save(this.itemSupplierRepo.create(link));
    }
    this.logger.log(`Seeded ${links.length} item-supplier links.`);
  }

  // ── Usage guide ─────────────────────────────────────────────

  private logUsageGuide(): void {
    this.logger.log('═══════════════════════════════════════════');
    this.logger.log('  Demo credentials:');
    this.logger.log('  ─────────────────────────────────────');
    for (const u of DEMO_USERS) {
      this.logger.log(`  ${u.roleName.padEnd(8)} ${u.email} / ${u.password}`);
    }
    this.logger.log('═══════════════════════════════════════════');
  }
}
