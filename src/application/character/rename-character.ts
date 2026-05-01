import type { CharacterRepository } from "@/domain/character/character-repository";
import type { CharacterId } from "@/domain/character/character";

export async function renameCharacter(
  repo: CharacterRepository,
  characterId: CharacterId,
  requesterId: string,
  name: string,
): Promise<void> {
  const character = await repo.findById(characterId);
  if (!character) throw new Error("Character not found");
  if (character.ownerId !== requesterId) throw new Error("Not authorized");

  character.rename(name);
  await repo.save(character);
}
