import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  phone: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie?.value) {
      return null;
    }

    // In a production app, you'd verify and decrypt the session token
    // For simplicity, we'll store user data in the cookie
    const user = JSON.parse(sessionCookie.value);
    return user;
  } catch {
    return null;
  }
}

export async function setSession(user: User): Promise<void> {
  const cookieStore = await cookies();
  
  // Only use secure cookies if explicitly enabled via env var AND using HTTPS
  // For HTTP deployments, set USE_SECURE_COOKIES=false
  const useSecureCookies = process.env.USE_SECURE_COOKIES === 'true';
  
  cookieStore.set('session', JSON.stringify(user), {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

