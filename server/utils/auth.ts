import { Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { getEnvOrFallback } from "./env";
import { supabase } from "./db";
import { storage } from "../storage";

const scryptAsync = promisify(scrypt);
const JWT_SECRET = getEnvOrFallback("JWT_SECRET", "koach-reader-jwt-secret-key");

// Hash password with scrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare password with stored hash
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function attachUser(req: Request, userId: string): Promise<void> {
  const user = await storage.getUser(userId);
  (req as any).user = user ?? { id: userId };
  (req as any).userId = userId;
}

// JWT verification: supports Supabase JWT + custom JWT, populates req.user
export function verifyJWT(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }
  const token = authHeader.substring(7);

  const run = async () => {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
      if (!error && authUser?.id) {
        await attachUser(req, authUser.id);
        next();
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      if (decoded?.userId) {
        await attachUser(req, decoded.userId);
        next();
        return;
      }
    } catch {
      /* invalid */
    }
    res.status(401).json({ message: "Invalid token" });
  };
  run();
}