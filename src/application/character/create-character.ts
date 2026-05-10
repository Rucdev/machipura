import { Character } from "@/domain/character/character";
import type { CharacterRepository } from "@/domain/character/character-repository";
import type { UserId } from "@/domain/map/map";
import { Traits } from "@/domain/shared/traits";
import { randomUUID } from "crypto";

function generateTraits(): Traits {
  return new Traits({});
}

export async function createCharacter(
  repo: CharacterRepository,
  ownerId: UserId,
  name: string,
): Promise<string> {
  const seed = Math.floor(Math.random() * 0x100000000);
  const character = new Character(randomUUID(), name, ownerId, generateTraits(), seed);
  await repo.save(character);
  return character.id;
}
