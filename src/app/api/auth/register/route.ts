import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../../../models/prisma';
import { sendWelcomeEmail } from '../../../../services/email';

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
    const { email, password, firstName, lastName, referralCode } = await req.json();

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ message: 'Please provide all required fields.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'Email is already registered.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const selfReferralCode = `MRC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    let referredByUser = null;
    if (referralCode) {
      referredByUser = await prisma.user.findUnique({
        where: { referralCode },
      });
    }

    // Create user and cart
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        referralCode: selfReferralCode,
        referredBy: referredByUser ? referredByUser.id : null,
        // Give new user 50 welcome points, and if referred, give additional 50 points
        points: referredByUser ? 100 : 50,
        cart: {
          create: {},
        },
      },
    });

    // If referred, award points to the referrer
    if (referredByUser) {
      await prisma.user.update({
        where: { id: referredByUser.id },
        data: {
          points: {
            increment: 100, // Reward 100 points
          },
        },
      });

      // Send push notification to referrer
      await prisma.notification.create({
        data: {
          userId: referredByUser.id,
          title: 'Referral Reward!',
          message: `${firstName} registered using your link. 100 reward points credited.`,
          type: 'REWARD',
        },
      });
    }

    // Send rich HTML welcome email via Nodemailer
    await sendWelcomeEmail(email, firstName);

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
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Register API Error]:', error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
