import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import {
  User, InsertUser, Category, InsertCategory, Product, InsertProduct,
  ProductInput, CartItem, InsertCartItem, ProductSearchParams, Order,
  OrderInput, OrderItem, OrderSearchParams, shopSettingsSchema, seoSettingsSchema,
  users, categories, products, cartItems, orders, orderItems, shopSettings,
  passwordResetTokens, InsertPasswordResetToken, PasswordResetToken,
  wishlistItems, InsertWishlistItem, WishlistItem, CategoryWithImage,
  verificationCodes, InsertVerificationCode, VerificationCode
} from "@shared/schema";
import { z } from "zod";
import { and, eq, like, between, desc, asc, sql, isNull, isNotNull, gte, lte, or, not, ilike, inArray } from "drizzle-orm";
import * as crypto from "crypto";

const PostgresSessionStore = connectPg(session);

// Простой in-memory кеш для тяжёлых запросов
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
    } else {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    }
  }
}

const cache = new SimpleCache();

export interface IStorage {
  // Session Store
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  searchUsers(params: {
    query?: string;
    role?: string;
    isActive?: boolean;
    page: number;
    limit: number;
  }): Promise<{ users: User[], total: number }>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;

  // Category operations
  getAllCategories(): Promise<Category[]>;
  getCategoriesBySupplier(supplier?: string): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  deleteAllCategories(): Promise<boolean>;

  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsByCategoryId(categoryId: number): Promise<Product[]>;
  searchProducts(params: {
    query?: string;
    categoryId?: number;
    supplier?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'featured' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: ProductInput): Promise<Product>;
  updateProduct(id: number, product: Partial<ProductInput>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  deleteProductsByCategory(categoryId: number): Promise<boolean>;
  deleteProductsByTag(tag: string): Promise<boolean>;
  deleteAllProducts(): Promise<boolean>;
  bulkImportProducts(products: InsertProduct[]): Promise<{ success: number, failed: number }>;

  // Cart operations
  getCartItems(cartId: string): Promise<CartItem[]>;
  getCartItemWithProduct(cartId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(cartId: string): Promise<boolean>;

  // Order operations
  createOrder(orderInput: OrderInput, cartItems: (CartItem & { product: Product })[], userId?: number): Promise<Order>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  getOrderById(id: number): Promise<(Order & { items: (OrderItem & { product?: Product })[] }) | undefined>;
  getAllOrders(): Promise<Order[]>;
  searchOrders(params: OrderSearchParams): Promise<{ orders: Order[], total: number }>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  getOrderItemsWithProducts(orderId: number): Promise<(OrderItem & { product?: Product })[]>;

  // Settings operations
  getShopSettings(): Promise<Record<string, any>>;
  updateShopSettings(settings: z.infer<typeof shopSettingsSchema>): Promise<boolean>;
  getSeoSettings(): Promise<Record<string, any>>;
  updateSeoSettings(settings: z.infer<typeof seoSettingsSchema>): Promise<boolean>;

  // Password reset operations
  createPasswordResetToken(userId: number): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(token: string): Promise<boolean>;
  deleteExpiredPasswordResetTokens(): Promise<number>;

  // Statistics operations
  getProductsCount(): Promise<number>;
  getCategoriesCount(): Promise<number>;

  // Categories with images (optimized)
  getCategoriesWithFirstImage(supplier?: string): Promise<CategoryWithImage[]>;

  // Wishlist operations
  getWishlistItems(userId: number): Promise<(WishlistItem & { product: Product })[]>;
  addToWishlist(userId: number, productId: number): Promise<WishlistItem>;
  removeFromWishlist(userId: number, productId: number): Promise<boolean>;
  isInWishlist(userId: number, productId: number): Promise<boolean>;

  // Email verification operations
  createVerificationCode(userId: number, code: string): Promise<VerificationCode>;
  getVerificationCode(userId: number, code: string): Promise<VerificationCode | undefined>;
  markEmailAsVerified(userId: number): Promise<boolean>;
  deleteVerificationCodes(userId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'sessions',
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async searchUsers(params: {
    query?: string;
    role?: string;
    isActive?: boolean;
    page: number;
    limit: number;
  }): Promise<{ users: User[], total: number }> {
    let query = db.select().from(users);

    // Фильтрация по поисковому запросу
    if (params.query) {
      query = query.where(
        sql`(${users.username} ILIKE ${'%' + params.query + '%'} OR ${users.email} ILIKE ${'%' + params.query + '%'} OR ${users.fullName} ILIKE ${'%' + params.query + '%'})`
      );
    }

    // Фильтрация по роли
    if (params.role) {
      query = query.where(eq(users.role, params.role));
    }

    // Фильтрация по статусу активности
    if (params.isActive !== undefined) {
      query = query.where(eq(users.isActive, params.isActive));
    }

    // Подсчет общего количества пользователей для пагинации
    const countQuery = sql`SELECT COUNT(*) FROM (${query}) AS count_query`;
    const countResult = await db.execute(countQuery);
    const total = parseInt(countResult.rows[0]?.count || '0');

    // Пагинация
    const offset = (params.page - 1) * params.limit;
    query = query.limit(params.limit).offset(offset);
    query = query.orderBy(desc(users.id));

    const usersResult = await query;

    return {
      users: usersResult,
      total
    };
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    // Получаем все категории
    const allCategories = await db.select().from(categories).orderBy(categories.name);

    // Получаем счетчики товаров для всех категорий одним запросом
    const productCounts = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)`.as('count')
      })
      .from(products)
      .where(eq(products.isActive, true))
      .groupBy(products.categoryId);

    // Создаем Map для быстрого поиска счетчиков
    const countMap = new Map(
      productCounts.map(pc => [pc.categoryId, Number(pc.count)])
    );

    // Объединяем данные
    return allCategories.map(category => ({
      ...category,
      productCount: countMap.get(category.id) || 0
    })) as Category[];
  }

  async getCategoriesBySupplier(supplier?: string): Promise<Category[]> {
    // Получаем все категории
    const allCategories = await db.select().from(categories).orderBy(categories.name);

    // Фильтруем товары по поставщику если указан
    const conditions = [eq(products.isActive, true)];
    if (supplier) {
      conditions.push(eq(products.tag, supplier));
    }

    const productCounts = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`count(*)`.as('count')
      })
      .from(products)
      .where(and(...conditions))
      .groupBy(products.categoryId);

    // Создаем Map для быстрого поиска счетчиков
    const countMap = new Map(
      productCounts.map(pc => [pc.categoryId, Number(pc.count)])
    );

    // Объединяем данные и фильтруем только категории с товарами
    return allCategories
      .map(category => ({
        ...category,
        productCount: countMap.get(category.id) || 0
      }))
      .filter(category => category.productCount > 0) as Category[];
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    if (result.length === 0) return undefined;
    
    const category = result[0];
    return {
      ...category,
      productCount: category.productCount ?? 0
    };
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.slug, slug));
    if (result.length === 0) return undefined;
    
    const category = result[0];
    return {
      ...category,
      productCount: category.productCount ?? 0
    };
  }

  async getCategoryByName(name: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.name, name));
    if (result.length === 0) return undefined;
    
    const category = result[0];
    return {
      ...category,
      productCount: category.productCount ?? 0
    };
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    const newCategory = result[0];
    return {
      ...newCategory,
      productCount: newCategory.productCount ?? 0
    };
  }

  async updateCategory(id: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    if (result.length === 0) return undefined;
    
    const category = result[0];
    return {
      ...category,
      productCount: category.productCount ?? 0
    };
  }

  async deleteCategory(id: number): Promise<boolean> {
    // Проверяем, есть ли товары в этой категории
    const productsCount = await db.select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.categoryId, id));

    if (productsCount[0].count > 0) {
      return false;
    }

    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  async deleteAllCategories(): Promise<boolean> {
    try {
      // Сначала удаляем все товары
      await db.delete(cartItems);
      await db.delete(products);
      // Затем удаляем все категории
      await db.delete(categories);
      return true;
    } catch (error) {
      console.error('Ошибка при удалении всех категорий:', error);
      return false;
    }
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    // Ищем без учёта регистра (ilike) для поддержки кириллицы в разных регистрах
    const result = await db.select().from(products).where(ilike(products.slug, slug));
    return result.length > 0 ? result[0] : undefined;
  }

  async getProductsByCategoryId(categoryId: number): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async searchProducts(params: {
    query?: string;
    categoryId?: number;
    categoryIds?: number[];
    supplier?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'featured' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    let baseQuery = db.select().from(products);
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(products);

    const conditions: any[] = [eq(products.isActive, true)];

    // Текстовый поиск
    if (params.query?.trim()) {
      const searchTerm = `%${params.query.trim()}%`;
      conditions.push(
        or(
          sql`${products.name} ILIKE ${searchTerm}`,
          sql`${products.description} ILIKE ${searchTerm}`,
          sql`${products.sku} ILIKE ${searchTerm}`
        )
      );
    }

    // Фильтр по категориям (множественный выбор)
    if (params.categoryIds && params.categoryIds.length > 0) {
      conditions.push(inArray(products.categoryId, params.categoryIds));
    } else if (params.categoryId) {
      // Обратная совместимость с одиночным categoryId
      conditions.push(eq(products.categoryId, params.categoryId));
    }

    // Supplier/Brand filter (поддержка множественного выбора через запятую)
    if (params.supplier) {
      const suppliers = params.supplier.split(',').map(s => s.trim());
      if (suppliers.length === 1) {
        conditions.push(ilike(products.tag, `%${suppliers[0]}%`));
      } else {
        // Множественный выбор брендов через OR
        const supplierConditions = suppliers.map(s => ilike(products.tag, `%${s}%`));
        conditions.push(or(...supplierConditions));
      }
    }

    // Фильтр по цене
    if (params.minPrice !== undefined) {
      conditions.push(sql`CAST(${products.price} AS DECIMAL) >= ${params.minPrice}`);
    }
    if (params.maxPrice !== undefined) {
      conditions.push(sql`CAST(${products.price} AS DECIMAL) <= ${params.maxPrice}`);
    }

    // Применяем условия к запросам
    const whereClause = and(...conditions);
    baseQuery = baseQuery.where(whereClause);
    countQuery = countQuery.where(whereClause);

    // Получаем общее количество
    const [{ count }] = await countQuery;
    const total = Number(count) || 0;

    // Сортировка
    if (params.sort) {
      switch (params.sort) {
        case "price_asc":
          baseQuery = baseQuery.orderBy(asc(products.price));
          break;
        case "price_desc":
          baseQuery = baseQuery.orderBy(desc(products.price));
          break;
        case "name_asc":
          baseQuery = baseQuery.orderBy(asc(products.name));
          break;
        case "name_desc":
          baseQuery = baseQuery.orderBy(desc(products.name));
          break;
        case "featured":
        default:
          baseQuery = baseQuery.orderBy(desc(products.isFeatured), asc(products.name));
          break;
      }
    }

    // Пагинация
    const offset = (params.page - 1) * params.limit;
    baseQuery = baseQuery.limit(params.limit).offset(offset);

    const productsResult = await baseQuery;

    return {
      products: productsResult,
      total
    };
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isFeatured, true));
  }

  async createProduct(productInput: ProductInput): Promise<Product> {
    // Оптимизация: преобразуем ProductInput в InsertProduct
    const insertProduct: InsertProduct = {
      sku: productInput.sku,
      name: productInput.name,
      slug: productInput.slug,
      description: productInput.description || null,
      shortDescription: productInput.shortDescription || null,
      price: productInput.price,
      originalPrice: productInput.originalPrice || null,
      imageUrl: productInput.imageUrl || null,
      stock: productInput.stock || null,
      categoryId: productInput.categoryId,
      isActive: productInput.isActive ?? true,
      isFeatured: productInput.isFeatured ?? false,
      tag: productInput.tag || null,
      specifications: productInput.specifications || null,
    };

    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  async updateProduct(id: number, updateData: Partial<ProductInput>): Promise<Product | undefined> {
    // Преобразовать ProductInput в структуру для БД
    const updateValues: Partial<InsertProduct> = { 
      ...updateData,
      description: updateData.description ?? undefined,
      shortDescription: updateData.shortDescription ?? undefined,
      originalPrice: updateData.originalPrice ?? undefined,
      imageUrl: updateData.imageUrl ?? undefined,
      stock: updateData.stock ?? undefined,
      tag: updateData.tag ?? undefined
    };

    const result = await db.update(products)
      .set(updateValues)
      .where(eq(products.id, id))
      .returning();

    return result.length > 0 ? result[0] : undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async deleteProductsByCategory(categoryId: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.categoryId, categoryId)).returning();
    return true;
  }

  async deleteProductsByTag(tag: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.tag, tag)).returning();
    return true;
  }

  async deleteAllProducts(): Promise<boolean> {
    try {
      // Сначала удаляем все товары из корзин
      await db.delete(cartItems);
      // Затем удаляем все товары
      await db.delete(products);
      return true;
    } catch (error) {
      console.error('Ошибка при удалении всех товаров:', error);
      return false;
    }
  }

  async bulkImportProducts(productsToImport: InsertProduct[]): Promise<{ success: number, failed: number }> {
    let success = 0;
    let failed = 0;

    // Валидируем и преобразуем продукты
    const validProducts: InsertProduct[] = [];

    for (const productData of productsToImport) {
      try {
        // Проверяем обязательные поля
        if (!productData.name || !productData.sku || !productData.slug || !productData.categoryId) {
          console.log('Пропущен продукт с недостающими полями:', productData);
          failed++;
          continue;
        }

        const validProduct: InsertProduct = {
          sku: String(productData.sku),
          name: String(productData.name),
          slug: String(productData.slug),
          description: productData.description || null,
          shortDescription: productData.shortDescription || null,
          price: typeof productData.price === 'string' ? productData.price : String(productData.price || '0'),
          originalPrice: productData.originalPrice ? (typeof productData.originalPrice === 'string' ? productData.originalPrice : String(productData.originalPrice)) : null,
          imageUrl: productData.imageUrl || null,
          stock: productData.stock ? Number(productData.stock) : null,
          categoryId: Number(productData.categoryId),
          isActive: productData.isActive !== false,
          isFeatured: Boolean(productData.isFeatured),
          tag: productData.tag || null,
        };

        validProducts.push(validProduct);
      } catch (error) {
        console.error("Ошибка валидации продукта:", error);
        failed++;
      }
    }

    // Обработка продуктов по одному с проверкой дубликатов
    for (const productData of validProducts) {
      try {
        // Проверяем существование товара по SKU или slug
        const existingProduct = await db
          .select()
          .from(products)
          .where(or(eq(products.sku, productData.sku), eq(products.slug, productData.slug)))
          .limit(1);

        if (existingProduct.length > 0) {
          // Обновляем существующий товар
          await db
            .update(products)
            .set({
              name: productData.name,
              description: productData.description,
              shortDescription: productData.shortDescription,
              price: productData.price,
              originalPrice: productData.originalPrice,
              categoryId: productData.categoryId,
              stock: productData.stock,
              imageUrl: productData.imageUrl,
              isActive: productData.isActive,
              isFeatured: productData.isFeatured,
              tag: productData.tag,
              updatedAt: new Date()
            })
            .where(eq(products.id, existingProduct[0].id));
          success++;
        } else {
          // Создаем новый товар
          await db.insert(products).values(productData);
          success++;
        }
      } catch (error) {
        console.error("Ошибка при импорте товара:", error);
        failed++;
      }
    }

    return { success, failed };
  }

  // Cart operations
  async getCartItems(cartId: string): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  }

  async getCartItemWithProduct(cartId: string): Promise<(CartItem & { product: Product })[]> {
    const result = await db.select({
      id: cartItems.id,
      cartId: cartItems.cartId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      addedAt: cartItems.addedAt,
      product: products
    })
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId))
    .innerJoin(products, eq(cartItems.productId, products.id));

    return result;
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Проверяем, существует ли уже такой товар в корзине
    const existingItem = await db.select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, insertCartItem.cartId),
          eq(cartItems.productId, insertCartItem.productId)
        )
      );

    if (existingItem.length > 0) {
      // Если товар уже в корзине, обновим его количество
      const newQuantity = existingItem[0].quantity + (insertCartItem.quantity || 1);
      const result = await db.update(cartItems)
        .set({ quantity: newQuantity })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();

      return result[0];
    }

    // Иначе добавим новый товар в корзину
    const validatedItem = {
      ...insertCartItem,
      quantity: insertCartItem.quantity || 1, // Если количество не указано, установим 1
      addedAt: new Date()
    };

    const result = await db.insert(cartItems).values(validatedItem).returning();
    return result[0];
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem | undefined> {
    const result = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();

    return result.length > 0 ? result[0] : undefined;
  }

  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems)
      .where(eq(cartItems.id, id))
      .returning();

    return result.length > 0;
  }

  async clearCart(cartId: string): Promise<boolean> {
    const result = await db.delete(cartItems)
      .where(eq(cartItems.cartId, cartId))
      .returning();

    return true; // Даже если корзина пуста, считаем операцию успешной
  }

  // Order operations
  async createOrder(orderInput: OrderInput, cartItems: (CartItem & { product: Product })[], userId?: number): Promise<Order> {
    // Рассчитаем общую сумму заказа
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0
    );

    // Создаем заказ в транзакции
    // Note: для PostgreSQL используем транзакции
    const orderResult = await db.transaction(async (tx) => {
      // 1. Создаем основную запись заказа
      const orderData = {
        userId: userId || null,
        customerName: orderInput.customerName,
        customerEmail: orderInput.customerEmail,
        customerPhone: orderInput.customerPhone,
        address: orderInput.address,
        city: orderInput.city,
        postalCode: orderInput.postalCode,
        paymentMethod: orderInput.paymentMethod,
        paymentStatus: "pending",
        totalAmount,
        status: "pending",
        notes: orderInput.notes || null,
        createdAt: new Date()
      };

      const [order] = await tx.insert(orders).values(orderData).returning();

      // 2. Добавляем элементы заказа
      for (const item of cartItems) {
        const orderItemData = {
          orderId: order.id,
          productId: item.product.id,
          productName: item.product.name,
          productPrice: parseFloat(item.product.price.toString()),
          quantity: item.quantity,
          totalPrice: item.quantity * parseFloat(item.product.price.toString())
        };

        await tx.insert(orderItems).values(orderItemData);
      }

      return order;
    });

    // 3. Очищаем корзину после создания заказа
    await this.clearCart(orderInput.cartId);

    return orderResult;
  }

  async getOrderById(id: number): Promise<(Order & { items: (OrderItem & { product?: Product })[] }) | undefined> {
    const orderResult = await db.select().from(orders).where(eq(orders.id, id));

    if (orderResult.length === 0) {
      return undefined;
    }

    const order = orderResult[0];

    // Получаем элементы заказа с информацией о товарах
    const orderItemsWithProduct = await db.select({
      orderItem: orderItems,
      product: products
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, id))
    .leftJoin(products, eq(orderItems.productId, products.id));

    const items = orderItemsWithProduct.map(row => ({
      ...row.orderItem,
      product: row.product
    }));

    return {
      ...order,
      items
    };
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async searchOrders(params: OrderSearchParams): Promise<{ orders: Order[], total: number }> {
    // Базовый запрос для поиска заказов
    let query = db.select().from(orders);

    // Фильтрация по поисковому запросу
    if (params.query) {
      query = query.where(
        sql`(${orders.customerName} ILIKE ${'%' + params.query + '%'} OR 
             ${orders.customerEmail} ILIKE ${'%' + params.query + '%'} OR 
             ${orders.customerPhone} ILIKE ${'%' + params.query + '%'})`
      );
    }

    // Фильтрация по статусу
    if (params.status && params.status !== 'all') {
      query = query.where(eq(orders.status, params.status));
    }

    // Фильтрация по датам
    if (params.startDate) {
      query = query.where(sql`${orders.createdAt} >= ${new Date(params.startDate)}`);
    }

    if (params.endDate) {
      query = query.where(sql`${orders.createdAt} <= ${new Date(params.endDate)}`);
    }

    // Подсчет общего количества заказов для пагинации
    const countQuery = sql`SELECT COUNT(*) FROM (${query}) AS count_query`;
    const countResult = await db.execute(countQuery);
    const total = parseInt(countResult.rows[0]?.count || '0');

    // Сортировка по дате создания (новые в начале)
    query = query.orderBy(desc(orders.createdAt));

    // Пагинация
    const offset = (params.page - 1) * params.limit;
    query = query.limit(params.limit).offset(offset);

    const ordersResult = await query;

    return {
      orders: ordersResult,
      total
    };
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();

    return result.length > 0 ? result[0] : undefined;
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async getOrderItemsWithProducts(orderId: number): Promise<(OrderItem & { product?: Product })[]> {
    const result = await db.select({
      orderItem: orderItems,
      product: products
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .leftJoin(products, eq(orderItems.productId, products.id));

    return result.map(row => ({
      ...row.orderItem,
      product: row.product
    }));
  }

  // Settings operations
  async getShopSettings(): Promise<Record<string, any>> {
    const result = await db.select()
      .from(shopSettings)
      .where(eq(shopSettings.key, 'shop_settings'));

    if (result.length === 0) {
      // Возвращаем настройки по умолчанию, если их еще нет
      return {
        shopName: "ЭПС",
        shopDescription: "Коллекция профессиональных инструментов",
        contactEmail: "info@example.com",
        contactPhone: "+7 8442 50-58-57",
        address: "г. Волгоград, ул. им. Маршала Еременко 44",
        workingHours: "пн. - пт.: 8:00 - 19:00, сб.: 9:00 - 15:00, вс: выходной",
        enableRegistration: true,
        enableCheckout: true,
        maintenanceMode: false,
      };
    }

    return result[0].value as Record<string, any>;
  }

  async updateShopSettings(settings: z.infer<typeof shopSettingsSchema>): Promise<boolean> {
    try {
      // Проверяем наличие обязательных полей
      const validSettings = {
        ...settings,
        enableRegistration: settings.enableRegistration ?? true,
        enableCheckout: settings.enableCheckout ?? true,
        maintenanceMode: settings.maintenanceMode ?? false
      };

      const result = await db.select().from(shopSettings).where(eq(shopSettings.key, 'shop_settings'));

      if (result.length === 0) {
        // Если настроек еще нет, создаем их
        await db.insert(shopSettings).values({
          key: 'shop_settings',
          value: validSettings as any,
          updatedAt: new Date()
        });
      } else {
        // Иначе обновляем существующие
        await db.update(shopSettings)
          .set({ 
            value: validSettings as any,
            updatedAt: new Date()
          })
          .where(eq(shopSettings.key, 'shop_settings'));
      }

      return true;
    } catch (error) {
      console.error('Ошибка при обновлении настроек магазина:', error);
      return false;
    }
  }

  async getSeoSettings(): Promise<Record<string, any>> {
    const result = await db.select()
      .from(shopSettings)
      .where(eq(shopSettings.key, 'seo_settings'));

    if (result.length === 0) {
      // Возвращаем настройки по умолчанию, если их еще нет
      return {
        siteTitle: "ЭПС - Коллекция профессиональных инструментов",
        metaDescription: "ЭПС - магазин профессиональных инструментов в Волгограде. Большой выбор, доступные цены.",
        metaKeywords: "инструменты, электроинструменты, ручные инструменты, Волгоград",
        ogImage: "",
        googleAnalyticsId: "",
        yandexMetrikaId: "",
      };
    }

    return result[0].value as Record<string, any>;
  }

  async updateSeoSettings(settings: z.infer<typeof seoSettingsSchema>): Promise<boolean> {
    try {
      const result = await db.select().from(shopSettings).where(eq(shopSettings.key, 'seo_settings'));

      if (result.length === 0) {
        // Если настроек еще нет, создаем их
        await db.insert(shopSettings).values({
          key: 'seo_settings',
          value: settings as any,
          updatedAt: new Date()
        });
      } else {
        // Иначе обновляем существующие
        await db.update(shopSettings)
          .set({ 
            value: settings as any,
            updatedAt: new Date() 
          })
          .where(eq(shopSettings.key, 'seo_settings'));
      }

      return true;
    } catch (error) {
      console.error('Ошибка при обновлении SEO настроек:', error);
      return false;
    }
  }

  // Password reset operations
  async createPasswordResetToken(userId: number): Promise<PasswordResetToken> {
    // Генерируем случайный токен и срок годности (24 часа)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const tokenData: InsertPasswordResetToken = {
      userId,
      token,
      expiresAt
    };

    // Удаляем все предыдущие токены для пользователя
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

    // Создаем новый токен
    const [result] = await db.insert(passwordResetTokens).values(tokenData).returning();
    return result;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const result = await db.select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
          gte(passwordResetTokens.expiresAt, new Date())
        )
      );

    return result.length > 0 ? result[0] : undefined;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<boolean> {
    const result = await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token))
      .returning();

    return result.length > 0;
  }

  async deleteExpiredPasswordResetTokens(): Promise<number> {
    const result = await db.delete(passwordResetTokens)
      .where(
        or(
          lte(passwordResetTokens.expiresAt, new Date()),
          not(isNull(passwordResetTokens.usedAt))
        )
      )
      .returning();

    return result.length;
  }

  // Statistics operations
  async getProductsCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(products);
    return Number(result[0]?.count || 0);
  }

  async getCategoriesCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(categories);
    return Number(result[0]?.count || 0);
  }

  // Оптимизированный метод для получения категорий с изображением первого товара
  async getCategoriesWithFirstImage(supplier?: string): Promise<CategoryWithImage[]> {
    const cacheKey = `categories-with-images:${supplier || 'all'}`;

    // Проверяем кеш (TTL 2 минуты)
    const cached = cache.get<CategoryWithImage[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Один SQL запрос с агрегацией вместо загрузки всех товаров
      const supplierCondition = supplier ? `AND p.tag ILIKE '%${supplier}%'` : '';

      const result = await db.execute(sql.raw(`
        SELECT
          c.id,
          c.name,
          c.slug,
          c.description,
          c.icon,
          COALESCE(stats.product_count, 0)::int as product_count,
          stats.first_image as image_url
        FROM categories c
        LEFT JOIN (
          SELECT
            category_id,
            COUNT(*)::int as product_count,
            MIN(image_url) as first_image
          FROM products p
          WHERE p.is_active = true AND p.image_url IS NOT NULL
          ${supplierCondition}
          GROUP BY category_id
        ) stats ON c.id = stats.category_id
        WHERE COALESCE(stats.product_count, 0) > 0
        ORDER BY c.name
      `));

      const categories = (result.rows as any[]).map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        icon: row.icon,
        productCount: row.product_count,
        imageUrl: row.image_url
      }));

      // Кешируем на 2 минуты
      cache.set(cacheKey, categories, 2 * 60 * 1000);

      return categories;
    } catch (error) {
      console.error("Error in getCategoriesWithFirstImage:", error);
      throw error;
    }
  }

  // Wishlist operations
  async getWishlistItems(userId: number): Promise<(WishlistItem & { product: Product })[]> {
    const result = await db
      .select({
        id: wishlistItems.id,
        userId: wishlistItems.userId,
        productId: wishlistItems.productId,
        createdAt: wishlistItems.createdAt,
        product: products
      })
      .from(wishlistItems)
      .where(eq(wishlistItems.userId, userId))
      .innerJoin(products, eq(wishlistItems.productId, products.id))
      .orderBy(desc(wishlistItems.createdAt));

    return result;
  }

  async addToWishlist(userId: number, productId: number): Promise<WishlistItem> {
    // Проверяем, не добавлен ли уже товар
    const existing = await db
      .select()
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      ));

    if (existing.length > 0) {
      return existing[0];
    }

    const [result] = await db
      .insert(wishlistItems)
      .values({ userId, productId })
      .returning();

    return result;
  }

  async removeFromWishlist(userId: number, productId: number): Promise<boolean> {
    const result = await db
      .delete(wishlistItems)
      .where(and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      ))
      .returning();

    return result.length > 0;
  }

  async isInWishlist(userId: number, productId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.userId, userId),
        eq(wishlistItems.productId, productId)
      ));

    return result.length > 0;
  }

  // Email verification operations
  async createVerificationCode(userId: number, code: string): Promise<VerificationCode> {
    // Удаляем все предыдущие коды для пользователя
    await db.delete(verificationCodes).where(eq(verificationCodes.userId, userId));

    // Срок годности - 15 минут
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const [result] = await db.insert(verificationCodes).values({
      userId,
      code,
      expiresAt
    }).returning();

    return result;
  }

  async getVerificationCode(userId: number, code: string): Promise<VerificationCode | undefined> {
    const result = await db.select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.code, code),
          isNull(verificationCodes.usedAt),
          gte(verificationCodes.expiresAt, new Date())
        )
      );

    return result.length > 0 ? result[0] : undefined;
  }

  async markEmailAsVerified(userId: number): Promise<boolean> {
    // Помечаем код как использованный
    await db.update(verificationCodes)
      .set({ usedAt: new Date() })
      .where(eq(verificationCodes.userId, userId));

    // Обновляем пользователя
    const result = await db.update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    return result.length > 0;
  }

  async deleteVerificationCodes(userId: number): Promise<boolean> {
    await db.delete(verificationCodes).where(eq(verificationCodes.userId, userId));
    return true;
  }
}

// Функция для обновления счетчиков товаров в категориях
async function updateCategoryProductCounts() {
  try {
    // Обновляем счетчики всех категорий
    const result = await db.execute(sql`
      UPDATE ${categories} 
      SET product_count = (
        SELECT COUNT(*) 
        FROM ${products} 
        WHERE ${products.categoryId} = ${categories.id} 
        AND ${products.isActive} = 1
      )
    `);
    console.log('Счетчики категорий обновлены');
  } catch (error) {
    console.error('Ошибка при обновлении счетчиков категорий:', error);
  }
}

export const storage = new DatabaseStorage();