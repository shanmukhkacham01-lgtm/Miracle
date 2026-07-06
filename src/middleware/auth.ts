import jwt from 'jsonwebtoken';
import prisma from '../models/prisma';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  firstName: string;
  lastName: string;
}

export async function verifyAuth(req: Request): Promise<AuthenticatedUser> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: Missing or invalid token.');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'miracle_premium_jwt_secret_key_123!'
    ) as { id: string; role: 'USER' | 'ADMIN' };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new Error('Unauthorized: User not found.');
    }

    return user as AuthenticatedUser;
  } catch (error) {
    throw new Error('Unauthorized: Invalid or expired session.');
  }
}
