import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isSuperUser: integer("is_super_user", { mode: "boolean" }).notNull().default(false),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  isStation: integer("is_station", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const categoryActions = sqliteTable("category_actions", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
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
  x: real("x").notNull(),
  y: real("y").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
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
  fromIsStation: integer("from_is_station", { mode: "boolean" }).notNull().default(false),
  toIsStation: integer("to_is_station", { mode: "boolean" }).notNull().default(false),
  fromX: real("from_x").notNull(),
  fromY: real("from_y").notNull(),
  toX: real("to_x").notNull(),
  toY: real("to_y").notNull(),
});

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").notNull(),
  traits: text("traits", { mode: "json" }).notNull(),
  seed: integer("seed").notNull().default(0),
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
