import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SchemaResolver {
  constructor(private readonly dataSource: DataSource) {}

  async ensureSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId}`;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
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
