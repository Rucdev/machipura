import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { categories, categoryActions } from "../db/schema";
import { Category, type CategoryId } from "@/domain/shared/category";
import { CategoryAction, type CategoryActionId } from "@/domain/shared/category-action";
import type { CategoryRepository } from "@/domain/shared/category-repository";

export class DrizzleCategoryRepository implements CategoryRepository {
  constructor(private readonly db: Db) {}

  async findAllCategories(): Promise<Category[]> {
    const rows = await this.db.query.categories.findMany({
      orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.label)],
    });
    return rows.map((r) => new Category(r.id, r.label, r.isStation));
  }

  async findCategoryById(id: CategoryId): Promise<Category | undefined> {
    const row = await this.db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
    if (!row) return undefined;
    return new Category(row.id, row.label, row.isStation);
  }

  async saveCategory(category: Category): Promise<void> {
    await this.db
      .insert(categories)
      .values({
        id: category.id,
        label: category.label,
        isStation: category.isStation,
        sortOrder: 0,
      })
      .onConflictDoUpdate({
        target: categories.id,
        set: { label: category.label, isStation: category.isStation },
      });
  }

  async deleteCategory(id: CategoryId): Promise<void> {
    await this.db.delete(categories).where(eq(categories.id, id));
  }

  async findActionsByCategoryId(categoryId: CategoryId): Promise<CategoryAction[]> {
    const rows = await this.db.query.categoryActions.findMany({
      where: eq(categoryActions.categoryId, categoryId),
      orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.description)],
    });
    return rows.map((r) => new CategoryAction(r.id, r.categoryId, r.description, r.sortOrder));
  }

  async findAllActions(): Promise<CategoryAction[]> {
    const rows = await this.db.query.categoryActions.findMany({
      orderBy: (t, { asc }) => [asc(t.categoryId), asc(t.sortOrder)],
    });
    return rows.map((r) => new CategoryAction(r.id, r.categoryId, r.description, r.sortOrder));
  }

  async saveAction(action: CategoryAction): Promise<void> {
    await this.db
      .insert(categoryActions)
      .values({
        id: action.id,
        categoryId: action.categoryId,
        description: action.description,
        sortOrder: action.sortOrder,
      })
      .onConflictDoUpdate({
        target: categoryActions.id,
        set: {
          description: action.description,
          sortOrder: action.sortOrder,
        },
      });
  }

  async deleteAction(id: CategoryActionId): Promise<void> {
    await this.db.delete(categoryActions).where(eq(categoryActions.id, id));
  }
}
