import { NextResponse } from 'next/server';
import prisma from '../../../../models/prisma';
import { verifyAuth } from '../../../../middleware/auth';

export async function GET(req: Request) {
  try {
    const sessionUser = await verifyAuth(req);

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        addresses: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
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
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Get Profile Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const sessionUser = await verifyAuth(req);
    const { firstName, lastName } = await req.json();

    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        firstName,
        lastName,
      },
    });

    return NextResponse.json({
      status: 'success',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        points: user.points,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Update Profile Error]:', error);
    return NextResponse.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}
