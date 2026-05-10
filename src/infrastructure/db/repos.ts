import { db } from "./client";
import { DrizzleMapRepository } from "../repository/map-repository";
import { DrizzleCharacterRepository } from "../repository/character-repository";
import { DrizzleJourneyRepository } from "../repository/journey-repository";
import { DrizzleCategoryRepository } from "../repository/category-repository";

export const mapRepo = new DrizzleMapRepository(db);
export const characterRepo = new DrizzleCharacterRepository(db);
export const journeyRepo = new DrizzleJourneyRepository(db);
export const categoryRepo = new DrizzleCategoryRepository(db);
