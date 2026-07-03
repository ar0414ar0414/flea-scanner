import { pgTable, text, integer, timestamp, boolean, real, uuid, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scans = pgTable("scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  imageUrl: text("image_url"),
  aiResult: jsonb("ai_result"),       // Gemini識別結果
  priceData: jsonb("price_data"),     // 相場データ
  medianPrice: integer("median_price"),
  purchasePrice: integer("purchase_price"),
  shippingCost: integer("shipping_cost"),
  profit: integer("profit"),
  profitRate: real("profit_rate"),
  isPurchased: boolean("is_purchased").default(false).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const priceCache = pgTable("price_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyword: text("keyword").notNull().unique(),
  priceData: jsonb("price_data").notNull(),
  cachedAt: timestamp("cached_at").defaultNow().notNull(),
});
