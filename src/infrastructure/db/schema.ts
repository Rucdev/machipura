import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const maps = sqliteTable("maps", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull(),
});

export const places = sqliteTable("places", {
  id: text("id").primaryKey(),
  mapId: text("map_id")
    .notNull()
    .references(() => maps.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  category: text("category").notNull(),
  openHour: integer("open_hour").notNull(),
  openMinute: integer("open_minute").notNull(),
  closeHour: integer("close_hour").notNull(),
  closeMinute: integer("close_minute").notNull(),
});

export const paths = sqliteTable("paths", {
  id: text("id").primaryKey(),
  mapId: text("map_id")
    .notNull()
    .references(() => maps.id, { onDelete: "cascade" }),
  fromPlaceId: text("from_place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  toPlaceId: text("to_place_id")
    .notNull()
    .references(() => places.id, { onDelete: "cascade" }),
  transport: text("transport").notNull(),
  distanceKm: real("distance_km").notNull(),
});

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull(),
  // Traits はカテゴリごとの行動重みをJSONで保持
  traits: text("traits", { mode: "json" }).notNull(),
});

export const journeys = sqliteTable("journeys", {
  id: text("id").primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id),
  mapId: text("map_id")
    .notNull()
    .references(() => maps.id, { onDelete: "cascade" }),
  startPlaceId: text("start_place_id").notNull(),
  goalPlaceId: text("goal_place_id").notNull(),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["in_progress", "completed"] }).notNull(),
});

export const actionLogs = sqliteTable("action_logs", {
  id: text("id").primaryKey(),
  journeyId: text("journey_id")
    .notNull()
    .references(() => journeys.id, { onDelete: "cascade" }),
  placeId: text("place_id").notNull(),
  arrivedAt: integer("arrived_at", { mode: "timestamp" }).notNull(),
  travelDurationMinutes: real("travel_duration_minutes").notNull(),
  action: text("action").notNull(),
});
