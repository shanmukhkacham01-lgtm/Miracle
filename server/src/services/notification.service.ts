import fs from 'fs';
import path from 'path';
import prisma from '../models/prisma';
import { sendEmail as sendMailViaNodemailer } from './email.service';

const logFilePath = path.join(__dirname, '../../logs/notifications.log');

const logNotification = (type: string, recipient: string, title: string, body: string) => {
  const logDir = path.dirname(logFilePath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = `[${new Date().toISOString()}] [${type.toUpperCase()}] To: ${recipient} | Subject/Title: ${title}\nBody: ${body}\n--------------------------------------------------\n`;
  fs.appendFileSync(logFilePath, logEntry);
  console.log(`\n=== [NOTIFICATION SENT] ===\nType: ${type}\nTo: ${recipient}\nSubject: ${title}\n============================\n`);
};

// Real Nodemailer-backed sendEmail — used by auth.controller and elsewhere
export const sendEmail = async (to: string, subject: string, htmlContent: string) => {
  logNotification('email', to, subject, htmlContent.replace(/<[^>]*>/g, ' '));
  await sendMailViaNodemailer({ to, subject, html: htmlContent });
};

export const sendSMS = async (phone: string, message: string) => {
  logNotification('sms', phone, 'SMS Dispatch', message);
};

export const createPushNotification = async (userId: string, title: string, message: string, type: 'ORDER' | 'SYSTEM' | 'REWARD' | 'PROMO') => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
    logNotification('push', userId, title, message);
    return notification;
  } catch (error) {
    console.error('[Failed to save push notification to database]:', error);
  }
};

