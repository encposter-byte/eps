import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import session from "express-session";
import bcrypt from "bcrypt";
import { generateVerificationCode, sendVerificationCode } from "./email";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

export function setupAuth(app: Express) {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'eps-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Register endpoint
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      console.log('Register request body:', req.body);

      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Все поля обязательны" });
      }

      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь уже существует" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email уже используется" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with emailVerified = false
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        role: 'user'
      });

      // Generate and send verification code
      const code = generateVerificationCode();
      await storage.createVerificationCode(user.id, code);

      const emailSent = await sendVerificationCode(email, code);
      if (!emailSent) {
        console.error('Failed to send verification email to:', email);
      }

      // Set session but mark as unverified
      (req.session as any).userId = user.id;
      (req.session as any).user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: false
      };

      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: false,
        message: "Код подтверждения отправлен на email"
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Ошибка регистрации" });
    }
  });

  // Verify email endpoint
  app.post("/api/verify-email", async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      const sessionUser = (req.session as any)?.user;

      if (!sessionUser) {
        return res.status(401).json({ message: "Требуется авторизация" });
      }

      if (!code || code.length !== 6) {
        return res.status(400).json({ message: "Введите 6-значный код" });
      }

      const verificationCode = await storage.getVerificationCode(sessionUser.id, code);
      if (!verificationCode) {
        return res.status(400).json({ message: "Неверный или просроченный код" });
      }

      // Mark email as verified
      await storage.markEmailAsVerified(sessionUser.id);

      // Update session
      (req.session as any).user = {
        ...sessionUser,
        emailVerified: true
      };

      res.json({
        message: "Email успешно подтверждён",
        emailVerified: true
      });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: "Ошибка верификации" });
    }
  });

  // Resend verification code
  app.post("/api/resend-code", async (req: Request, res: Response) => {
    try {
      const sessionUser = (req.session as any)?.user;

      if (!sessionUser) {
        return res.status(401).json({ message: "Требуется авторизация" });
      }

      const user = await storage.getUser(sessionUser.id);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email уже подтверждён" });
      }

      // Generate and send new code
      const code = generateVerificationCode();
      await storage.createVerificationCode(user.id, code);

      const emailSent = await sendVerificationCode(user.email, code);
      if (!emailSent) {
        return res.status(500).json({ message: "Ошибка отправки кода" });
      }

      res.json({ message: "Новый код отправлен на email" });
    } catch (error) {
      console.error('Resend code error:', error);
      res.status(500).json({ message: "Ошибка отправки кода" });
    }
  });

  // Login endpoint
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Введите логин и пароль" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      };

      // If email not verified, send new code
      if (!user.emailVerified) {
        const code = generateVerificationCode();
        await storage.createVerificationCode(user.id, code);
        await sendVerificationCode(user.email, code);
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Ошибка входа" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка выхода" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Успешный выход" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", async (req: Request, res: Response) => {
    const sessionUser = (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: "Не авторизован" });
    }

    // Get fresh user data from DB
    const user = await storage.getUser(sessionUser.id);
    if (!user) {
      return res.status(401).json({ message: "Пользователь не найден" });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified
    });
  });
}

// Auth middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req.session as any)?.user;
  if (!user) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }
  req.user = user;
  next();
}

// Admin middleware
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const sessionUser = (req.session as any)?.user;
  if (!sessionUser) {
    return res.status(401).json({ message: "Требуется авторизация" });
  }

  try {
    // Обновляем данные пользователя из базы данных для актуальной роли
    const currentUser = await storage.getUser(sessionUser.id);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: "Требуются права администратора" });
    }

    // Обновляем сессию с актуальными данными
    (req.session as any).user = {
      id: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      role: currentUser.role
    };

    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Error checking admin rights:', error);
    return res.status(500).json({ message: "Ошибка проверки прав доступа" });
  }
}