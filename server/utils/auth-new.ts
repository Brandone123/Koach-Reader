import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "koach-reader-jwt-secret-key";

// JWT verification middleware
export function verifyJWT(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = (decoded as any).userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}