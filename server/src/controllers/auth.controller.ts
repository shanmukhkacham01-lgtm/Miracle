import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../models/prisma';
import { AppError } from '../middleware/error.middleware';
import { sendEmail, sendSMS } from '../services/notification.service';
import { sendWelcomeEmail } from '../services/email.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'miracle_premium_jwt_secret_key_123!',
    { expiresIn: process.env.JWT_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || 'miracle_premium_jwt_refresh_secret_key_456!',
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, referralCode } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return next(new AppError('Please provide all required fields.', 400));
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('Email is already registered.', 400));
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

    res.status(201).json({
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
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password.', 400));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return next(new AppError('Incorrect email or password.', 401));
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    res.status(200).json({
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
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required.', 400));
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
      return next(new AppError('User not found.', 404));
    }

    const tokens = generateTokens(user.id, user.role);

    res.status(200).json({
      status: 'success',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    return next(new AppError('Invalid or expired refresh token. Please login again.', 401));
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: {
        addresses: true,
      },
    });

    if (!user) {
      return next(new AppError('User not found.', 404));
    }

    res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        points: user.points,
        referralCode: user.referralCode,
        isEmailVerified: user.isEmailVerified,
        addresses: user.addresses,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user?.id },
      data: {
        firstName,
        lastName,
      },
    });

    res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        points: user.points,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone) return next(new AppError('Phone number is required.', 400));

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real app we store this OTP in a Redis server or db with expiration
    // Let's print SMS to simulate it
    await sendSMS(phone, `Your MIRACLE verification code is ${otp}. Valid for 10 minutes.`);

    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully.',
      // Returning for easy developer testing
      devOtp: otp,
    });
  } catch (error) {
    next(error);
  }
};

export const googleLoginMock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName } = req.body;

    if (!email) return next(new AppError('Google email required.', 400));

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const selfReferral = `MRC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
          firstName: firstName || 'Google',
          lastName: lastName || 'User',
          referralCode: selfReferral,
          isEmailVerified: true,
          cart: { create: {} },
        },
      });
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    res.status(200).json({
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
      },
    });
  } catch (error) {
    next(error);
  }
};
