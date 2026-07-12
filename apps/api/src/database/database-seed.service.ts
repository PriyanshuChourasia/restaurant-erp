import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { CategoryEntity } from '../category/entities/category.entity';
import { Item, GstRate, ItemUnit } from '../items/entities/item.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { Inventory, StockMovement, MovementType } from '../inventory/entities/inventory.entity';
import { LedgerAccount, LedgerEntry, LedgerEntryType, LedgerCategory } from '../ledger/entities/ledger.entity';
import { Invoice, InvoiceItem, InvoiceStatus, PaymentMethod } from '../sales/entities/sales.entity';
import { Kot, KotItem, KotStatus, KotStation } from '../kot/entities/kot.entity';
import { Purchase, PurchaseItem, PurchaseStatus } from '../purchases/entities/purchase.entity';

const MODULES = [
  'auth', 'users', 'roles', 'permissions',
  'menu', 'orders', 'inventory', 'staff', 'reservations', 'reports', 'settings',
  'items', 'purchases', 'suppliers', 'sales', 'kot', 'ledger',
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
      'sales.read', 'sales.create', 'sales.update', 'sales.discount',
      'menu.read',
      'items.read',
      'reports.read',
      'ledger.read',
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

const DEMO_ITEMS: Array<Partial<Item>> = [
  { name: 'Butter Chicken', sku: 'M-001', hsnCode: '2105', price: 349, costPrice: 200, gstRate: GstRate.FIVE, unit: ItemUnit.BOWL, isVeg: false, categoryId: 'a0000001-0000-0000-0000-000000000009' },
  { name: 'Dal Makhani', sku: 'M-002', hsnCode: '2104', price: 249, costPrice: 80, gstRate: GstRate.FIVE, unit: ItemUnit.BOWL, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000008' },
  { name: 'Chicken Biryani', sku: 'M-003', hsnCode: '2105', price: 299, costPrice: 150, gstRate: GstRate.FIVE, unit: ItemUnit.PLATE, isVeg: false, categoryId: 'a0000001-0000-0000-0000-000000000009' },
  { name: 'Veg Biryani', sku: 'M-004', hsnCode: '2104', price: 249, costPrice: 100, gstRate: GstRate.FIVE, unit: ItemUnit.PLATE, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000008' },
  { name: 'Paneer Tikka', sku: 'S-001', hsnCode: '2104', price: 199, costPrice: 80, gstRate: GstRate.FIVE, unit: ItemUnit.PLATE, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000003' },
  { name: 'Chicken Tikka', sku: 'S-002', hsnCode: '2105', price: 229, costPrice: 120, gstRate: GstRate.FIVE, unit: ItemUnit.PLATE, isVeg: false, categoryId: 'a0000001-0000-0000-0000-000000000003' },
  { name: 'Tomato Soup', sku: 'S-003', hsnCode: '2104', price: 149, costPrice: 50, gstRate: GstRate.NIL, unit: ItemUnit.BOWL, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000010' },
  { name: 'Masala Dosa', sku: 'S-004', hsnCode: '2104', price: 179, costPrice: 40, gstRate: GstRate.FIVE, unit: ItemUnit.PLATE, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000003' },
  { name: 'Gulab Jamun', sku: 'D-001', hsnCode: '1704', price: 89, costPrice: 30, gstRate: GstRate.FIVE, unit: ItemUnit.PLATE, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000005' },
  { name: 'Ice Cream', sku: 'D-002', hsnCode: '2105', price: 99, costPrice: 40, gstRate: GstRate.TWELVE, unit: ItemUnit.CUP, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000005' },
  { name: 'Masala Chai', sku: 'B-001', hsnCode: '0902', price: 39, costPrice: 10, gstRate: GstRate.FIVE, unit: ItemUnit.CUP, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000006' },
  { name: 'Cold Coffee', sku: 'B-002', hsnCode: '2202', price: 129, costPrice: 40, gstRate: GstRate.TWELVE, unit: ItemUnit.GLASS, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000007' },
  { name: 'Fresh Lime Soda', sku: 'B-003', hsnCode: '2202', price: 69, costPrice: 15, gstRate: GstRate.TWELVE, unit: ItemUnit.GLASS, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000007' },
  { name: 'Naan Bread', sku: 'S-005', hsnCode: '1905', price: 39, costPrice: 10, gstRate: GstRate.NIL, unit: ItemUnit.PIECE, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000003' },
  { name: 'Tandoori Roti', sku: 'S-006', hsnCode: '1905', price: 29, costPrice: 8, gstRate: GstRate.NIL, unit: ItemUnit.PIECE, isVeg: true, categoryId: 'a0000001-0000-0000-0000-000000000003' },
];

const DEMO_LEDGER_ACCOUNTS: Array<Partial<LedgerAccount>> = [
  { name: 'Cash Account', description: 'Cash in hand', openingBalance: 50000, financialYear: '2026-27' },
  { name: 'Sales Revenue', description: 'Revenue from food sales', openingBalance: 0, financialYear: '2026-27' },
  { name: 'Purchase Account', description: 'Inventory purchase expenses', openingBalance: 0, financialYear: '2026-27' },
  { name: 'GST Payable', description: 'GST collected from customers', openingBalance: 0, financialYear: '2026-27' },
  { name: 'GST Input Credit', description: 'GST paid on purchases', openingBalance: 0, financialYear: '2026-27' },
  { name: 'Salary Account', description: 'Employee salary expenses', openingBalance: 0, financialYear: '2026-27' },
  { name: 'Rent Account', description: 'Restaurant rent expenses', openingBalance: 0, financialYear: '2026-27' },
  { name: 'Bank Account', description: 'Business bank account', openingBalance: 200000, financialYear: '2026-27' },
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
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Checking seed data...');

    const allPermissions = await this.seedPermissions();
    const roleMap = await this.seedRoles(allPermissions);
    await this.seedUsers(roleMap);
    await this.seedCategories();
    await this.seedSuppliers();
    const items = await this.seedItems();
    await this.seedInventory(items);
    await this.seedLedgerAccounts();
    await this.seedStockMovements(items);
    await this.seedPurchases(items);
    await this.seedInvoices(items);
    await this.seedKots(items);
    await this.seedLedgerEntries();

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

    const saved: Item[] = [];
    for (const data of DEMO_ITEMS) {
      const item = this.itemRepo.create(data as Item);
      saved.push(await this.itemRepo.save(item));
    }
    this.logger.log(`Seeded ${DEMO_ITEMS.length} demo menu items.`);
    return saved;
  }

  // ── Inventory ───────────────────────────────────────────────

  private async seedInventory(items: Item[]): Promise<void> {
    const count = await this.inventoryRepo.count();
    if (count > 0) {
      this.logger.log(`${count} inventory records already exist — skipping.`);
      return;
    }

    for (const item of items) {
      await this.inventoryRepo.save(
        this.inventoryRepo.create({
          itemId: item.id,
          openingBalance: 50,
          currentStock: 50,
          minStockLevel: 10,
          unitCost: item.costPrice || 0,
        }),
      );
    }
    this.logger.log(`Seeded inventory for ${items.length} items (opening stock: 50 each).`);
  }

  // ── Stock Movements ─────────────────────────────────────────

  private async seedStockMovements(items: Item[]): Promise<void> {
    const count = await this.stockMovementRepo.count();
    if (count > 0) {
      this.logger.log(`${count} stock movements already exist — skipping.`);
      return;
    }

    for (const item of items) {
      await this.stockMovementRepo.save(
        this.stockMovementRepo.create({
          itemId: item.id,
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
    const kotsData = [
      {
        kotNumber: 'KOT-2026-001',
        table: 'Table 5',
        station: KotStation.MAIN_KITCHEN,
        status: KotStatus.PREPARING,
        notes: 'Extra spicy please',
        lineItems: [
          { itemIdx: 0, qty: 1, instructions: 'Extra spicy, less oil' },
          { itemIdx: 13, qty: 3, instructions: null },
        ],
      },
      {
        kotNumber: 'KOT-2026-002',
        table: 'Table 7',
        station: KotStation.TANDOOR,
        status: KotStatus.PREPARING,
        notes: null,
        lineItems: [
          { itemIdx: 5, qty: 1, instructions: 'Well done' },
          { itemIdx: 14, qty: 2, instructions: null },
        ],
      },
      {
        kotNumber: 'KOT-2026-003',
        table: 'Table 12',
        station: KotStation.BEVERAGES,
        status: KotStatus.PENDING,
        notes: 'Serve with ice',
        lineItems: [
          { itemIdx: 11, qty: 2, instructions: 'Extra ice' },
          { itemIdx: 10, qty: 1, instructions: null },
        ],
      },
    ];

    for (const kotData of kotsData) {
      const kotItems: Partial<KotItem>[] = kotData.lineItems.map((li) => {
        const item = items[li.itemIdx];
        return {
          itemId: item.id,
          itemName: item.name,
          quantity: li.qty,
          instructions: li.instructions,
          status: kotData.status === KotStatus.PREPARING ? KotStatus.PREPARING : KotStatus.PENDING,
        };
      });

      const kot = this.kotRepo.create({
        kotNumber: kotData.kotNumber,
        tableIds: null,
        station: kotData.station,
        status: kotData.status,
        notes: kotData.notes,
        startedAt: kotData.status === KotStatus.PREPARING ? today : null,
        items: kotItems as KotItem[],
      });
      await this.kotRepo.save(kot);
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
