import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
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
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Please provide email and password.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ message: 'Incorrect email or password.' }, { status: 401 });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    return NextResponse.json({
      status: 'success',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        points: user.points,
        referralCode: user.referralCode,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Login API Error]:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
