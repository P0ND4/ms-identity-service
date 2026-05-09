import { DataSource, EntityManager, ObjectLiteral, Repository } from 'typeorm';
import { TenantContext } from '../tenant/tenant-context.service';

/**
 * Base repository for multi-tenant TypeORM entities.
 *
 * All concrete repositories extend this to inherit:
 *  - tableName() — schema-qualified table name via TenantContext
 *  - withTenantQueryRunner() — dedicated connection with SET search_path
 *  - findById(), findAll(), exists(), delete() — generic implementations
 *
 * Subclasses MUST implement save() and update() (entity-specific SQL).
 */
export abstract class TypeOrmRepository<
  T extends ObjectLiteral & { id: string },
> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly tenantContext: TenantContext,
    protected readonly dataSource: DataSource,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Shared helpers                                                    */
  /* ------------------------------------------------------------------ */

  /** Schema-qualified table name for raw SQL queries. */
  protected tableName(table: string): string {
    return `${this.tenantContext.schemaQuoted}.${table}`;
  }

  /** Fully-qualified table name derived from the entity metadata. */
  protected get qualifiedTableName(): string {
    return this.tableName(this.repository.metadata.tableName);
  }

  /**
   * Executes a callback with a dedicated QueryRunner whose `search_path`
   * is set to the tenant schema. Unqualified table names in TypeORM
   * `manager.find*` calls are resolved by PostgreSQL to the tenant schema.
   */
  protected async withTenantQueryRunner<R>(
    fn: (manager: EntityManager) => Promise<R>,
  ): Promise<R> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(
        `SET search_path TO ${this.tenantContext.schemaQuoted}`,
      );
      return await fn(queryRunner.manager);
    } finally {
      await queryRunner.query('RESET search_path');
      await queryRunner.release();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Generic CRUD (override when entity-specific logic is needed)      */
  /* ------------------------------------------------------------------ */

  async findById(id: string): Promise<T | null> {
    return (await this.withTenantQueryRunner((manager) =>
      manager.findOne(this.repository.target as any, { where: { id } }),
    )) as T | null;
  }

  async findAll(): Promise<T[]> {
    return (await this.withTenantQueryRunner((manager) =>
      manager.find(this.repository.target as any),
    )) as T[];
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.repository.query(
      `SELECT COUNT(*) as count FROM ${this.qualifiedTableName} WHERE id = $1`,
      [id],
    );
    return parseInt(result[0].count, 10) > 0;
  }

  /** Hard-delete (DELETE FROM). Override for soft-delete entities. */
  async delete(id: string): Promise<void> {
    await this.repository.query(
      `DELETE FROM ${this.qualifiedTableName} WHERE id = $1`,
      [id],
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Entity-specific (subclasses MUST implement)                       */
  /* ------------------------------------------------------------------ */

  abstract save(entity: Partial<T>): Promise<T>;
  abstract update(id: string, entity: Partial<T>): Promise<T>;
}
