import { eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { characters } from "../db/schema";
import { Character, type CharacterId } from "@/domain/character/character";
import type { CharacterRepository } from "@/domain/character/character-repository";
import type { UserId } from "@/domain/map/map";
import { Traits, type ActionWeights } from "@/domain/shared/traits";
import type { CategoryId } from "@/domain/shared/category";

export class DrizzleCharacterRepository implements CharacterRepository {
  constructor(private readonly db: Db) {}

  async findById(id: CharacterId): Promise<Character | undefined> {
    const row = await this.db.query.characters.findFirst({
      where: eq(characters.id, id),
    });
    if (!row) return undefined;
    return this.reconstruct(row);
  }

  async findByOwner(ownerId: UserId): Promise<Character[]> {
    const rows = await this.db.query.characters.findMany({
      where: eq(characters.ownerId, ownerId),
    });
    return rows.map((row) => this.reconstruct(row));
  }

  async save(character: Character): Promise<void> {
    await this.db
      .insert(characters)
      .values({
        id: character.id,
        name: character.name,
        ownerId: character.ownerId,
        traits: character.traits.weights,
        seed: character.seed,
      })
      .onConflictDoUpdate({
        target: characters.id,
        set: { name: character.name },
      });
  }

  async delete(id: CharacterId): Promise<void> {
    await this.db.delete(characters).where(eq(characters.id, id));
  }

  private reconstruct(row: typeof characters.$inferSelect): Character {
    const weights = row.traits as Partial<Record<CategoryId, ActionWeights>>;
    return new Character(row.id, row.name, row.ownerId, new Traits(weights), row.seed);
  }
}
