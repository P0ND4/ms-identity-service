import { Repository, ObjectLiteral } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { IRepository } from '../../domain/repositories/repository.interface';

export abstract class TypeOrmRepository<
  T extends ObjectLiteral & { id: string },
> implements IRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async findById(id: string): Promise<T | null> {
    return await this.repository.findOne({ where: { id } as T });
  }

  async findAll(): Promise<T[]> {
    return await this.repository.find();
  }

  async save(entity: Partial<T>): Promise<T> {
    const created = this.repository.create(entity as T);
    return await this.repository.save(created);
  }

  async update(id: string, entity: Partial<T>): Promise<T> {
    await this.repository.update(id, entity as QueryDeepPartialEntity<T>);
    return (await this.findById(id))!;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } as T });
    return count > 0;
  }
}
