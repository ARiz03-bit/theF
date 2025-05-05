import jwt from "jsonwebtoken";

export const JWT_SECRET = process.env.JWT_SECRET || "your-secret"; // Nên đặt biến môi trường khi deploy

export interface UserContext {
  workspace_id: string;
  scopes: string[];
}

// Hàm tạo JWT (dùng cho endpoint login)
export function generateJWT(workspace_id: string, scopes: string[]): string {
  return jwt.sign(
    {
      workspace_id,
      scopes,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

// Hàm lấy user từ Authorization header (dùng cho các endpoint CRUD)
export function getUserFromAuthHeader(headers: any, bodyHeaders?: any): UserContext {
    // Ưu tiên lấy token từ bodyHeaders (nếu có), nếu không thì lấy từ headers thực sự
    const authHeader =
      (bodyHeaders && (bodyHeaders.authorization || bodyHeaders.Authorization)) ||
      headers?.authorization ||
      headers?.Authorization;
  
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Unauthorized: missing or invalid Authorization header");
    }
    const token = authHeader.substring(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      return {
        workspace_id: payload.workspace_id,
        scopes: payload.scopes,
      };
    } catch (err) {
      throw new Error("Unauthorized: invalid token");
    }
  }