import type { CategoryId } from "./category";

export type CategoryActionId = string;

export class CategoryAction {
  constructor(
    readonly id: CategoryActionId,
    readonly categoryId: CategoryId,
    readonly description: string,
    readonly sortOrder: number,
  ) {}
}
