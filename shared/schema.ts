import { pgTable, text, serial, integer, boolean, numeric, timestamp, primaryKey, jsonb, bigint, varchar, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Sessions table (managed by connect-pg-simple, but declared here to prevent deletion)
// Using varchar and json to match existing table structure exactly
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull().$type<Record<string, unknown>>(),
  expire: timestamp("expire", { precision: 6, withTimezone: true }).notNull(),
});

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  fullName: true,
  phone: true,
  address: true,
  isActive: true,
});

// Пользовательские схемы для администрирования
export const userSearchSchema = z.object({
  query: z.string().optional(),
  role: z.union([z.string(), z.null()]).optional(),
  isActive: z.union([z.boolean(), z.string().transform(val => val === 'true'), z.null()]).optional(),
  page: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).transform(val => val || 1),
  limit: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).transform(val => val || 10)
});

// Categories Schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon").default("tool"),
  productCount: integer("product_count").default(0),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  slug: true,
  description: true,
  icon: true,
});

// Products Schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  stock: integer("stock").default(0),
  categoryId: integer("category_id").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  tag: text("tag"),
  specifications: jsonb("specifications"), // Характеристики товара в формате JSON
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  sku: true,
  name: true,
  slug: true,
  description: true,
  shortDescription: true,
  price: true,
  originalPrice: true,
  imageUrl: true,
  stock: true,
  categoryId: true,
  isActive: true,
  isFeatured: true,
  tag: true,
  specifications: true,
});

// CartItems Schema
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: text("cart_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  cartId: true,
  productId: true,
  quantity: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect & {
  productCount?: number;
};

// Базовый тип InsertProduct от схемы
export type InsertProduct = z.infer<typeof insertProductSchema> & {
  // Дополнительные поля для импорта
  categoryName?: string;
};
export type Product = typeof products.$inferSelect;

// Создаем типы с преобразованием для работы во фронтенде
export const productInputSchema = z.object({
  sku: z.string().min(1, "SKU обязателен"),
  name: z.string().min(1, "Название обязательно"),
  slug: z.string().min(1, "Slug обязателен"),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  price: z.union([z.number(), z.string().transform(val => parseFloat(val))]).pipe(z.number().min(0)),
  originalPrice: z.union([z.number(), z.string().transform(val => parseFloat(val)), z.null()]).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  stock: z.union([z.number(), z.string().transform(val => parseInt(val, 10)), z.null()]).pipe(z.number().min(0).optional().nullable()),
  categoryId: z.union([z.number(), z.string().transform(val => parseInt(val, 10))]).pipe(z.number().min(1)),
  isActive: z.union([z.boolean(), z.string().transform(val => val === "true")]).pipe(z.boolean()).default(true),
  isFeatured: z.union([z.boolean(), z.string().transform(val => val === "true")]).pipe(z.boolean()).default(false),
  tag: z.string().optional().nullable(),
  specifications: z.record(z.string()).optional().nullable(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

// Extended schemas for validation
export const productSearchSchema = z.object({
  query: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(['featured', 'price-low', 'price-high', 'newest', 'popular']).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(12),
});

export type ProductSearchParams = z.infer<typeof productSearchSchema>;

// Создаем более гибкую схему для импорта
export const bulkImportSchema = z.array(
  z.object({
    sku: z.string().min(1, "SKU обязателен"),
    name: z.string().min(1, "Название обязательно"),
    slug: z.string().min(1, "Slug обязателен"),
    description: z.string().optional().nullable(),
    shortDescription: z.string().optional().nullable(),
    price: z.string().min(1, "Цена обязательна"),
    originalPrice: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    stock: z.union([
      z.number(),
      z.string().transform(val => val === "" ? null : parseInt(val, 10)),
      z.null()
    ]).optional().nullable(),
    categoryId: z.number().default(1),
    // Добавляем поле с названием категории для автоматического создания
    categoryName: z.string().optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    tag: z.string().optional().nullable(),
  })
);

// Orders Schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  status: text("status").notNull().default("pending"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("Наличными при получении"),
  paymentStatus: text("payment_status").notNull().default("не оплачен"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  address: true,
  city: true,
  postalCode: true,
  status: true,
  totalAmount: true,
  paymentMethod: true,
  paymentStatus: true,
  notes: true,
});

// Order Items Schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  productPrice: numeric("product_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  productName: true,
  productPrice: true,
  quantity: true,
  totalPrice: true,
});

// Types
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Order input schema
export const orderInputSchema = z.object({
  customerName: z.string().min(1, "Имя обязательно"),
  customerEmail: z.string().email("Некорректный email"),
  customerPhone: z.string().min(5, "Телефон обязателен"),
  address: z.string().min(1, "Адрес обязателен"),
  city: z.string().min(1, "Город обязателен"),
  postalCode: z.string().min(1, "Индекс обязателен"),
  paymentMethod: z.enum(["Наличными при получении", "Картой при получении", "Онлайн оплата"]),
  notes: z.string().optional().nullable(),
  cartId: z.string().min(1, "ID корзины обязателен"),
});

export type OrderInput = z.infer<typeof orderInputSchema>;

// Order search schema
export const orderSearchSchema = z.object({
  query: z.string().optional(),
  status: z.enum(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

export type OrderSearchParams = z.infer<typeof orderSearchSchema>;

// Определяем отношения между таблицами
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
    relationName: "userOrders",
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Настройки магазина
export const shopSettings = pgTable("shop_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ShopSetting = typeof shopSettings.$inferSelect;

// Схемы для настроек магазина
export const shopSettingsSchema = z.object({
  shopName: z.string().min(1, "Название магазина обязательно"),
  shopDescription: z.string().optional(),
  contactEmail: z.string().email("Введите корректный email").min(1, "Email обязателен"),
  contactPhone: z.string().min(1, "Телефон обязателен"),
  address: z.string().min(1, "Адрес обязателен"),
  workingHours: z.string().optional(),
  enableRegistration: z.boolean().optional().default(true),
  enableCheckout: z.boolean().optional().default(true),
  maintenanceMode: z.boolean().optional().default(false),
});

// Схема для настроек SEO
export const seoSettingsSchema = z.object({
  siteTitle: z.string().min(1, "Title обязателен"),
  metaDescription: z.string().max(160, "Описание должно быть не более 160 символов").optional(),
  metaKeywords: z.string().optional(),
  ogImage: z.string().url("Укажите корректный URL").optional().or(z.literal("")),
  googleAnalyticsId: z.string().optional(),
  yandexMetrikaId: z.string().optional(),
});

// Таблица для хранения токенов сброса пароля
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Схема для запроса сброса пароля
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Введите корректный email").min(1, "Email обязателен"),
});

// Схема для установки нового пароля
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Токен обязателен"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
  confirmPassword: z.string().min(1, "Подтверждение пароля обязательно"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

// Wishlist (Избранное) Schema
export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).pick({
  userId: true,
  productId: true,
});

export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;

// Отношения для wishlist
export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

// Тип категории с изображением первого товара
export type CategoryWithImage = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  productCount: number;
  imageUrl: string | null;
};
