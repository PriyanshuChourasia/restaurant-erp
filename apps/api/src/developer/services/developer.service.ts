import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const MODULE_ENTITY_MAP = [
  { module: 'AuthModule', entities: ['User', 'RefreshToken'], description: 'JWT authentication & token management' },
  { module: 'UsersModule', entities: ['User'], description: 'User management & profiles' },
  { module: 'RolesModule', entities: ['Role'], description: 'Role-based access control' },
  { module: 'PermissionsModule', entities: ['Permission'], description: 'Granular permission definitions' },
  { module: 'CategoryModule', entities: ['CategoryEntity'], description: 'Tree-structured category management' },
  { module: 'StockItemsModule', entities: ['StockItem'], description: 'Menu items, raw materials, products' },
  { module: 'InventoryModule', entities: ['Inventory', 'StockMovement', 'StorageUnit', 'OpeningStockEntry', 'StockBatch', 'StockCount', 'StockCountLine', 'StockGroup', 'StockCategory', 'StockLedger'], description: 'Stock tracking, batches, movements' },
  { module: 'PurchasesModule', entities: ['Purchase', 'PurchaseItem'], description: 'Purchase orders & line items' },
  { module: 'SuppliersModule', entities: ['Supplier'], description: 'Supplier directory' },
  { module: 'SalesModule', entities: ['Invoice', 'InvoiceItem', 'CreditNote', 'CreditNoteItem'], description: 'Invoices, payments, credit notes' },
  { module: 'OrdersModule', entities: ['Order', 'OrderItem'], description: 'Order management' },
  { module: 'KotModule', entities: ['Kot', 'KotItem'], description: 'Kitchen Order Tickets' },
  { module: 'LedgerModule', entities: ['LedgerAccount', 'LedgerEntry', 'JournalEntry'], description: 'Double-entry bookkeeping' },
  { module: 'VouchersModule', entities: ['Voucher', 'VoucherType', 'VoucherModuleEntity'], description: 'Accounting vouchers' },
  { module: 'PriceLevelsModule', entities: ['PriceLevel', 'ItemPriceLevel'], description: 'Customer-tier pricing' },
  { module: 'CustomersModule', entities: ['Customer'], description: 'Customer directory' },
  { module: 'OrganizationModule', entities: ['Organization'], description: 'Organization settings' },
  { module: 'SeatingModule', entities: ['Zone', 'Table'], description: 'Restaurant zones & table layout' },
  { module: 'RecipesModule', entities: ['Recipe', 'RecipeIngredient', 'ProductionEntry'], description: 'Recipes & kitchen prep' },
  { module: 'ReservationsModule', entities: ['Reservation'], description: 'Table reservations' },
  { module: 'UnitsModule', entities: ['UnitOfMeasure', 'UnitConversion'], description: 'Units of measure & conversions' },
  { module: 'ItemSuppliersModule', entities: ['ItemSupplier'], description: 'Item-supplier linking' },
  { module: 'ReportsModule', entities: ['Invoice', 'InvoiceItem', 'StockItem', 'CategoryEntity', 'Inventory', 'StockMovement', 'StockCount', 'StockCountLine', 'Purchase', 'PurchaseItem', 'LedgerAccount', 'LedgerEntry', 'Kot', 'KotItem', 'Reservation', 'Customer', 'Zone', 'Table', 'Supplier', 'User', 'Organization'], description: 'Cross-module report queries (read-only)' },
  { module: 'DashboardModule', entities: ['Invoice', 'InvoiceItem'], description: 'Dashboard aggregates' },
  { module: 'DatabaseModule', entities: ['Permission', 'Role', 'User', 'CategoryEntity', 'StockItem', 'Supplier', 'Inventory', 'StockMovement', 'OpeningStockEntry', 'LedgerAccount', 'LedgerEntry', 'Invoice', 'InvoiceItem', 'Kot', 'KotItem', 'Purchase', 'PurchaseItem', 'Zone', 'Table', 'UnitOfMeasure', 'UnitConversion', 'StorageUnit', 'StockBatch', 'StockCount', 'StockCountLine', 'StockGroup', 'StockCategory', 'Customer', 'PriceLevel', 'ItemPriceLevel', 'Recipe', 'RecipeIngredient', 'Reservation', 'ItemSupplier', 'VoucherType', 'VoucherModuleEntity'], description: 'Database seeding & migrations' },
];

@Injectable()
export class DeveloperService {
  private readonly logger = new Logger(DeveloperService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async getDbInfo() {
    const result = await this.dataSource.query(`
      SELECT 
        current_database() as database,
        current_user as "user",
        version() as version,
        pg_database_size(current_database()) as "size"
    `);
    const row = result[0];
    return {
      database: row.database,
      user: row.user,
      version: row.version,
      sizeBytes: parseInt(row.size, 10),
      sizeFormatted: this.formatBytes(parseInt(row.size, 10)),
    };
  }

  async getTableStats() {
    const result = await this.dataSource.query(`
      SELECT 
        t.table_name as "tableName",
        pg_size_pretty(pg_total_relation_size('"' || t.table_name || '"')) as "totalSize",
        pg_total_relation_size('"' || t.table_name || '"') as "totalSizeBytes",
        (SELECT reltuples::bigint FROM pg_class WHERE relname = t.table_name) as "estimatedRows"
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
      ORDER BY pg_total_relation_size('"' || t.table_name || '"') DESC
    `);
    return result.map((r: any) => ({
      tableName: r.tableName,
      totalSize: r.totalSize,
      totalSizeBytes: parseInt(r.totalSizeBytes, 10),
      estimatedRows: parseInt(r.estimatedRows, 10) || 0,
    }));
  }

  async getTableData(tableName: string, limit = 100, offset = 0) {
    const sanitized = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    const countResult = await this.dataSource.query(
      `SELECT COUNT(*)::int as count FROM "${sanitized}"`,
    );
    const total = countResult[0]?.count || 0;

    const rows = await this.dataSource.query(
      `SELECT * FROM "${sanitized}" ORDER BY 1 LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return { data: rows, total, limit, offset };
  }

  async getTableColumns(tableName: string) {
    const result = await this.dataSource.query(`
      SELECT 
        c.column_name as "columnName",
        c.data_type as "dataType",
        c.is_nullable as "isNullable",
        c.column_default as "defaultValue",
        c.character_maximum_length as "maxLength",
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as "isPrimaryKey"
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku 
          ON tc.constraint_name = ku.constraint_name
        WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.column_name = pk.column_name
      WHERE c.table_name = $1 AND c.table_schema = 'public'
      ORDER BY c.ordinal_position
    `, [tableName]);
    return result.map((r: any) => ({
      columnName: r.columnName,
      dataType: r.dataType,
      isNullable: r.isNullable === 'YES',
      defaultValue: r.defaultValue,
      maxLength: r.maxLength,
      isPrimaryKey: r.isPrimaryKey,
    }));
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'restaurant_erp';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPass = process.env.DB_PASSWORD || 'postgres';

    try {
      await execAsync(
        `PGPASSWORD="${dbPass}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-owner --no-acl > "${filepath}"`,
        { timeout: 60000 },
      );

      const stats = fs.statSync(filepath);
      return {
        filename,
        filepath,
        sizeBytes: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        createdAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`Backup failed: ${error.message}`);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async listBackups() {
    if (!fs.existsSync(this.backupDir)) return [];
    const files = fs.readdirSync(this.backupDir)
      .filter((f) => f.endsWith('.sql'))
      .map((f) => {
        const stats = fs.statSync(path.join(this.backupDir, f));
        return {
          filename: f,
          sizeBytes: stats.size,
          sizeFormatted: this.formatBytes(stats.size),
          createdAt: stats.birthtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return files;
  }

  async restoreBackup(filename: string) {
    const filepath = path.join(this.backupDir, filename);
    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filename}`);
    }

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'restaurant_erp';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPass = process.env.DB_PASSWORD || 'postgres';

    try {
      await execAsync(
        `PGPASSWORD="${dbPass}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${filepath}"`,
        { timeout: 120000 },
      );
      return { success: true, message: `Restored from ${filename}` };
    } catch (error: any) {
      this.logger.error(`Restore failed: ${error.message}`);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  async createDatabase(dbName: string) {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPass = process.env.DB_PASSWORD || 'postgres';
    const currentDb = process.env.DB_NAME || 'restaurant_erp';

    const sanitized = dbName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

    try {
      await execAsync(
        `PGPASSWORD="${dbPass}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE \\"${sanitized}\\""`,
        { timeout: 30000 },
      );
      return { success: true, database: sanitized, message: `Database "${sanitized}" created` };
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        return { success: false, message: `Database "${sanitized}" already exists` };
      }
      throw new Error(`Create database failed: ${error.message}`);
    }
  }

  getModuleSchema() {
    return MODULE_ENTITY_MAP;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
