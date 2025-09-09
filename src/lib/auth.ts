import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

type UserLike = { id: string; role?: string; email?: string; pensionId?: string };

export function generateToken(user: UserLike): string {
  const payload = {
    id: user.id,
    role: user.role || 'admin',
    ...(user.email && { email: user.email }),
    ...(user.pensionId && { pensionId: user.pensionId })
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
