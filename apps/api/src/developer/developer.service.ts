import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DeveloperService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findAllTables() {
    const result = await this.dataSource.query(`
      SELECT
        t.table_name AS "tableName",
        t.table_type AS "tableType",
        COALESCE(pg_catalog.obj_description(
          (quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass
        ), '') AS "comment",
        (SELECT COUNT(*)
         FROM information_schema.columns c
         WHERE c.table_schema = t.table_schema
           AND c.table_name = t.table_name
        )::int AS "columnCount"
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name
    `);

    return result;
  }

  async findTableColumns(tableName: string) {
    const result = await this.dataSource.query(`
      SELECT
        c.column_name AS "columnName",
        c.data_type AS "dataType",
        c.is_nullable AS "isNullable",
        c.column_default AS "columnDefault",
        c.character_maximum_length AS "maxLength",
        c.ordinal_position AS "position"
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = $1
      ORDER BY c.ordinal_position
    `, [tableName]);

    return result;
  }

  async findTableData(tableName: string, limit = 100, offset = 0) {
    const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');

    const countResult = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM "${safeName}"`
    );
    const total = countResult[0]?.total ?? 0;

    const data = await this.dataSource.query(
      `SELECT * FROM "${safeName}" ORDER BY 1 LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return { data, total, limit, offset };
  }

  async findModuleSchema() {
    const result = await this.dataSource.query(`
      SELECT
        t.table_name AS "tableName",
        c.column_name AS "columnName",
        c.data_type AS "dataType",
        c.is_nullable AS "isNullable",
        c.column_default AS "columnDefault",
        c.character_maximum_length AS "maxLength"
      FROM information_schema.tables t
      JOIN information_schema.columns c
        ON c.table_schema = t.table_schema AND c.table_name = t.table_name
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position
    `);

    const tableMap = new Map<string, { module: string; entities: string[]; description: string }>();

    for (const row of result) {
      const tableName = row.tableName;
      if (!tableMap.has(tableName)) {
        tableMap.set(tableName, {
          module: tableName.charAt(0).toUpperCase() + tableName.slice(1).replace(/_/g, ' '),
          entities: [tableName],
          description: `${tableName} table with columns: `,
        });
      }
      const entry = tableMap.get(tableName)!;
      entry.description += row.columnName + ', ';
    }

    for (const entry of tableMap.values()) {
      entry.description = entry.description.slice(0, -2);
    }

    return Array.from(tableMap.values());
  }
}
