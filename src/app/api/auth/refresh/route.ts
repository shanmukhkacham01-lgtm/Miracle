import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '../../../../models/prisma';

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'miracle_premium_jwt_secret_key_123!',
    { expiresIn: process.env.JWT_EXPIRY || '15m' } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'miracle_premium_jwt_refresh_secret_key_456!',
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token is required.' }, { status: 400 });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'miracle_premium_jwt_refresh_secret_key_456!'
    ) as { id: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const tokens = generateTokens(user.id, user.role);

    return NextResponse.json({
      status: 'success',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Refresh API Error]:', error);
    return NextResponse.json({ message: 'Invalid or expired refresh token. Please login again.' }, { status: 401 });
  }
}
