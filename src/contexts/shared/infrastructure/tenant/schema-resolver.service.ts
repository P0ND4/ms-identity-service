import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SchemaResolver {
  private readonly logger = new Logger(SchemaResolver.name);

  private static readonly TABLES = [
    'collaborators',
    'collaborator_roles',
    'roles',
    'permissions',
    'role_permissions',
    'oauth_accounts',
    'refresh_tokens',
  ];

  constructor(private readonly dataSource: DataSource) {}

  async ensureSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const schemaCheck = await queryRunner.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
        [schemaName],
      );

      if (schemaCheck.length > 0) {
        return;
      }

      this.logger.log(`Provisioning schema "${schemaName}"...`);
      await queryRunner.query(`CREATE SCHEMA "${schemaName}"`);

      let tablesCreated = 0;
      for (const table of SchemaResolver.TABLES) {
        try {
          await queryRunner.query(
            `CREATE TABLE "${schemaName}"."${table}" (LIKE public."${table}" INCLUDING ALL)`,
          );
          tablesCreated++;
        } catch (err) {
          this.logger.error(
            `Failed to create table "${schemaName}"."${table}": ${(err as Error).message}`,
          );
        }
      }

      try {
        await queryRunner.query(
          `INSERT INTO "${schemaName}"."roles" ("id", "key", "name", "description", "is_default", "created_at", "updated_at")
           VALUES (gen_random_uuid(), 'admin', 'Admin', 'Full access administrator', false, NOW(), NOW())
           ON CONFLICT ("key") DO NOTHING`,
        );
        await queryRunner.query(
          `INSERT INTO "${schemaName}"."roles" ("id", "key", "name", "description", "is_default", "created_at", "updated_at")
           VALUES (gen_random_uuid(), 'user', 'User', 'Standard user', true, NOW(), NOW())
           ON CONFLICT ("key") DO NOTHING`,
        );
      } catch (err) {
        this.logger.error(
          `Failed to seed roles for "${schemaName}": ${(err as Error).message}`,
        );
      }

      this.logger.log(
        `Schema "${schemaName}" provisioned: ${tablesCreated}/${SchemaResolver.TABLES.length} tables + roles seeded`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async setSearchPath(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId}`;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`SET search_path TO "${schemaName}"`);
    } finally {
      await queryRunner.release();
    }
  }

  getSchemaName(tenantId: string): string {
    return `tenant_${tenantId}`;
  }
}
