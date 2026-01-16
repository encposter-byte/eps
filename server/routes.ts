import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import {
  insertUserSchema, insertCategorySchema, insertProductSchema, insertCartItemSchema,
  insertOrderSchema, productSearchSchema, orderSearchSchema, userSearchSchema,
  productInputSchema, orderInputSchema,
  passwordResetRequestSchema, passwordResetSchema
} from "@shared/schema";
import { setupAuth, requireAuth, requireAdmin } from "./auth";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { sendPasswordResetEmail } from "./services/email";
import express from 'express';

const router = express.Router();

// Функция валидации данных
const validateData = <T>(schema: z.ZodType<T>, data: any): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Ошибка валидации: ${result.error.message}`);
  }
  return result.data;
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Настройка авторизации
  setupAuth(app);

  // User Routes для администрирования
  router.post("/admin/users", requireAdmin, async (req, res) => {
    try {
      const userData = validateData(insertUserSchema, req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.put("/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;

      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.delete("/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      res.json({ message: "Пользователь удален" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.get("/admin/users", requireAdmin, async (req, res) => {
    try {
      const params = validateData(userSearchSchema, req.query);
      const result = await storage.searchUsers(params);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Category Routes
  router.get("/categories", async (req, res) => {
    try {
      const supplier = req.query.supplier as string | undefined;
      const categories = supplier
        ? await storage.getCategoriesBySupplier(supplier)
        : await storage.getAllCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ВАЖНО: этот маршрут должен быть ДО /categories/:id чтобы не перехватывался
  router.get("/categories/with-images", async (req, res) => {
    try {
      const supplier = req.query.supplier as string | undefined;
      const categories = await storage.getCategoriesWithFirstImage(supplier);
      res.json(categories);
    } catch (error: any) {
      console.error("Error in /api/categories/with-images:", error);
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ message: "Категория не найдена" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/admin/categories", requireAdmin, async (req, res) => {
    try {
      const categoryData = validateData(insertCategorySchema, req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.put("/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = validateData(insertCategorySchema.partial(), req.body);
      const category = await storage.updateCategory(id, updateData);
      if (!category) {
        return res.status(404).json({ message: "Категория не найдена" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.delete("/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Категория не найдена" });
      }
      res.json({ message: "Категория удалена" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Wishlist Routes
  router.get("/wishlist", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "Необходима авторизация" });
      }
      const items = await storage.getWishlistItems(userId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/wishlist/:productId", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "Необходима авторизация" });
      }
      const productId = parseInt(req.params.productId);
      const item = await storage.addToWishlist(userId, productId);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.delete("/wishlist/:productId", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "Необходима авторизация" });
      }
      const productId = parseInt(req.params.productId);
      const success = await storage.removeFromWishlist(userId, productId);
      if (!success) {
        return res.status(404).json({ message: "Товар не найден в избранном" });
      }
      res.json({ message: "Товар удален из избранного" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.get("/wishlist/check/:productId", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ message: "Необходима авторизация" });
      }
      const productId = parseInt(req.params.productId);
      const isInWishlist = await storage.isInWishlist(userId, productId);
      res.json({ isInWishlist });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Product Routes
  router.get("/products", async (req, res) => {
    try {
      // Если передан categorySlug, получаем categoryId
      let categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;

      if (!categoryId && req.query.categorySlug) {
        console.log(`[products] categorySlug: "${req.query.categorySlug}"`);
        const category = await storage.getCategoryBySlug(req.query.categorySlug as string);
        console.log(`[products] found category:`, category?.id || 'null');
        if (category) {
          categoryId = category.id;
        }
      }

      // Прямая обработка параметров без Zod
      const params: any = {
        query: req.query.query as string | undefined,
        categoryId,
        supplier: req.query.supplier as string | undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        sort: req.query.sort as any,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 12,
      };

      const result = await storage.searchProducts(params);

      // Добавляем информацию о пагинации
      const totalPages = Math.ceil(result.total / params.limit);

      res.json({
        products: result.products,
        total: result.total,
        page: params.page,
        limit: params.limit,
        totalPages: totalPages,
        hasNextPage: params.page < totalPages,
        hasPrevPage: params.page > 1
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/products/:id", async (req, res) => {
    try {
      // Try to parse as integer first (ID)
      const idNumber = parseInt(req.params.id);
      let product;

      // If it's a valid number, search by ID
      if (!isNaN(idNumber)) {
        product = await storage.getProductById(idNumber);
      }

      // Otherwise, search by slug
      if (!product) {
        product = await storage.getProductBySlug(req.params.id);
      }

      if (!product) {
        return res.status(404).json({ message: "Товар не найден" });
      }

      // Get category info for breadcrumbs
      const category = await storage.getCategoryById(product.categoryId);

      res.json({
        ...product,
        category: category ? { id: category.id, name: category.name, slug: category.slug } : null
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/admin/products", requireAdmin, async (req, res) => {
    try {
      const productData = validateData(productInputSchema, req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.put("/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = validateData(productInputSchema.partial(), req.body);
      const product = await storage.updateProduct(id, updateData);
      if (!product) {
        return res.status(404).json({ message: "Товар не найден" });
      }

      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.delete("/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Товар не найден" });
      }

      res.json({ message: "Товар удален" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });


  // Cart Routes
  router.get("/cart/:cartId", async (req, res) => {
    try {
      const cartId = req.params.cartId;
      const items = await storage.getCartItemWithProduct(cartId);

      // Calculate itemCount and subtotal
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = items.reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0);

      res.json({
        items,
        itemCount,
        subtotal
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.post("/cart", async (req, res) => {
    try {
      const cartItemData = validateData(insertCartItemSchema, req.body);
      const item = await storage.addToCart(cartItemData);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.put("/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      const item = await storage.updateCartItemQuantity(id, quantity);
      if (!item) {
        return res.status(404).json({ message: "Товар в корзине не найден" });
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.delete("/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.removeFromCart(id);
      if (!success) {
        return res.status(404).json({ message: "Товар в корзине не найден" });
      }
      res.json({ message: "Товар удален из корзины" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.delete("/cart/clear/:cartId", async (req, res) => {
    try {
      const cartId = req.params.cartId;
      const success = await storage.clearCart(cartId);
      res.json({ message: "Корзина очищена", success });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Order Routes
  router.post("/orders", async (req, res) => {
    try {
      const orderData = validateData(orderInputSchema, req.body);

      // Get cart items
      const cartItems = await storage.getCartItemWithProduct(orderData.cartId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Корзина пуста" });
      }

      // Получаем userId из сессии если пользователь авторизован
      const sessionUser = (req.session as any)?.user;
      const userId = sessionUser?.id;

      const order = await storage.createOrder(orderData, cartItems, userId);

      // Clear cart after successful order
      await storage.clearCart(orderData.cartId);

      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Получение заказов текущего пользователя
  router.get("/orders/my-orders", requireAuth, async (req, res) => {
    try {
      const userOrders = await storage.getOrdersByUserId(req.user!.id);
      res.json({ orders: userOrders });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Заказ не найден" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  router.get("/admin/orders", requireAdmin, async (req, res) => {
    try {
      const params = validateData(orderSearchSchema, req.query);
      const result = await storage.searchOrders(params);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.put("/admin/orders/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "Заказ не найден" });
      }
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Password reset routes
  router.post("/password-reset/request", async (req, res) => {
    try {
      const { email } = validateData(passwordResetRequestSchema, req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Пользователь с таким email не найден" });
      }

      const resetToken = await storage.createPasswordResetToken(user.id);
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken.token}`;

      const emailSent = await sendPasswordResetEmail(email, resetToken.token, resetUrl);

      if (emailSent) {
        res.json({ message: "Письмо для сброса пароля отправлено" });
      } else {
        res.status(500).json({ message: "Ошибка отправки письма" });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  router.post("/password-reset/confirm", async (req, res) => {
    try {
      const { token, password } = validateData(passwordResetSchema, req.body);

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ message: "Недействительный или истекший токен" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ message: "Пароль успешно изменен" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get product by slug - добавляем в router вместо app
  router.get("/products/slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;

      // Декодируем URL-encoded slug
      const decodedSlug = decodeURIComponent(slug);
      console.log(`Поиск товара по slug: "${decodedSlug}"`);

      const product = await storage.getProductBySlug(decodedSlug);

      if (!product) {
        console.log(`Товар с slug "${decodedSlug}" не найден`);
        return res.status(404).json({ 
          message: "Товар не найден",
          slug: decodedSlug
        });
      }

      console.log(`Найден товар: ${product.name} (ID: ${product.id})`);
      res.json(product);
    } catch (error: any) {
      console.error('Ошибка при поиске товара по slug:', error);
      res.status(500).json({ 
        message: "Ошибка сервера при поиске товара",
        error: error.message 
      });
    }
  });

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}