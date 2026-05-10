import type { Category, CategoryId } from "./category";
import type { CategoryAction, CategoryActionId } from "./category-action";

export interface CategoryRepository {
  findAllCategories(): Promise<Category[]>;
  findCategoryById(id: CategoryId): Promise<Category | undefined>;
  saveCategory(category: Category): Promise<void>;
  deleteCategory(id: CategoryId): Promise<void>;

  findActionsByCategoryId(categoryId: CategoryId): Promise<CategoryAction[]>;
  findAllActions(): Promise<CategoryAction[]>;
  saveAction(action: CategoryAction): Promise<void>;
  deleteAction(id: CategoryActionId): Promise<void>;
}
