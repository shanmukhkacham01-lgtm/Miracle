import nodemailer from 'nodemailer';

// ─────────────────────────────────────────────────
// Transporter — uses env SMTP settings.
// Falls back to Ethereal (auto test account) in
// development so no real credentials are needed.
// ─────────────────────────────────────────────────
let transporter: nodemailer.Transporter;

const initTransporter = async () => {
  if (transporter) return transporter;

  // If SMTP credentials are supplied, use them
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Auto-create a free Ethereal test account in development
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log(`[Mail] No SMTP credentials found — using Ethereal test account.`);
  console.log(`[Mail] Ethereal user: ${testAccount.user}`);
  console.log(`[Mail] Preview emails at: https://ethereal.email`);

  return transporter;
};

// ─────────────────────────────────────────────────
// Core send helper
// ─────────────────────────────────────────────────
export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  const transport = await initTransporter();
  const from = process.env.SMTP_FROM || 'MIRACLE Luxury <noreply@miracle.luxury>';

  try {
    const info = await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    // Log Ethereal preview URL in dev mode
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[Mail] Preview URL: ${previewUrl}`);
    }

    return info;
  } catch (error) {
    console.error('[Mail] Failed to send email:', error);
    // Don't throw — email failure should never crash the main flow
  }
};

// ─────────────────────────────────────────────────
// Shared HTML wrapper
// ─────────────────────────────────────────────────
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MIRACLE</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #FAFAF8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111111; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border: 1px solid #E8E8E8; border-radius: 12px; overflow: hidden; }
    .header { background: #111111; padding: 32px 40px; text-align: center; }
    .header span { font-size: 22px; font-weight: 700; letter-spacing: 8px; color: #C8A97E; }
    .header p { font-size: 9px; color: #666666; letter-spacing: 4px; margin-top: 4px; text-transform: uppercase; }
    .body { padding: 40px; }
    .body h2 { font-size: 20px; font-weight: 600; margin-bottom: 12px; }
    .body p { font-size: 13px; color: #444444; line-height: 1.7; margin-bottom: 12px; }
    .highlight { color: #C8A97E; font-weight: 600; }
    .btn { display: inline-block; margin-top: 20px; padding: 14px 32px; background: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 11px; font-weight: 700; letter-spacing: 3px; }
    .btn:hover { background: #C8A97E; }
    .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
    .order-table th { background: #FAFAF8; padding: 10px 12px; text-align: left; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #666666; border-bottom: 1px solid #E8E8E8; }
    .order-table td { padding: 12px; border-bottom: 1px solid #E8E8E8; color: #333333; }
    .order-table .total-row td { font-weight: 700; background: #FAFAF8; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .status-pending   { background: #FEF3C7; color: #D97706; }
    .status-shipped   { background: #DBEAFE; color: #2563EB; }
    .status-delivered { background: #D1FAE5; color: #059669; }
    .status-cancelled { background: #FEE2E2; color: #DC2626; }
    .status-paid      { background: #EDE9FE; color: #7C3AED; }
    .status-refunded  { background: #F3F4F6; color: #6B7280; }
    .divider { border: none; border-top: 1px solid #E8E8E8; margin: 28px 0; }
    .footer { background: #FAFAF8; padding: 24px 40px; text-align: center; border-top: 1px solid #E8E8E8; }
    .footer p { font-size: 10px; color: #999999; line-height: 1.6; }
    .footer a { color: #C8A97E; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <span>MIRACLE</span>
      <p>Luxury Redefined</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MIRACLE Luxury. All rights reserved.</p>
      <p style="margin-top:6px"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">Visit our store</a> &nbsp;·&nbsp; <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact">Contact us</a></p>
    </div>
  </div>
</body>
</html>`;

const formatINR = (usdAmount: number) =>
  `₹${(usdAmount * 83).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'status-pending',
    PAID: 'status-paid',
    SHIPPED: 'status-shipped',
    DELIVERED: 'status-delivered',
    CANCELLED: 'status-cancelled',
    REFUNDED: 'status-refunded',
  };
  return map[status] || 'status-pending';
};

// ─────────────────────────────────────────────────
// 1. Welcome / Registration Email
// ─────────────────────────────────────────────────
export const sendWelcomeEmail = async (to: string, firstName: string) => {
  const html = baseTemplate(`
    <h2>Welcome to MIRACLE, ${firstName}.</h2>
    <p>Thank you for joining our exclusive community. You now have access to our curated collection of the world's finest luxury goods — delivered directly to your door.</p>
    <p>Your account is ready. Explore our latest collections and experience the extraordinary.</p>
    <a class="btn" href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/shop">Explore Collection</a>
    <hr class="divider" />
    <p style="font-size:11px;color:#999">If you did not create this account, please ignore this email.</p>
  `);

  return sendEmail({
    to,
    subject: 'Welcome to MIRACLE — Your Account is Ready',
    html,
    text: `Welcome to MIRACLE, ${firstName}. Your account has been created. Visit ${process.env.FRONTEND_URL}/shop to explore our collections.`,
  });
};

// ─────────────────────────────────────────────────
// 2. Order Confirmation Email
// ─────────────────────────────────────────────────
export const sendOrderConfirmationEmail = async (
  to: string,
  firstName: string,
  order: {
    orderNumber: string;
    grandTotal: number;
    createdAt: Date;
    items: Array<{ name: string; quantity: number; price: number }>;
    shippingAddress?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  }
) => {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:right">${formatINR(item.price)}</td>
        <td style="text-align:right" class="highlight">${formatINR(item.price * item.quantity)}</td>
      </tr>`
    )
    .join('');

  const addressBlock = order.shippingAddress
    ? `<p style="font-size:12px;color:#666">${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}</p>`
    : '';

  const html = baseTemplate(`
    <h2>Order Confirmed, ${firstName}.</h2>
    <p>Your order <span class="highlight">#${order.orderNumber}</span> has been placed successfully and is being processed.</p>
    <hr class="divider" />
    <p style="font-size:11px;color:#999;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">Order Summary</p>
    <table class="order-table">
      <thead>
        <tr>
          <th>Item</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="total-row">
          <td colspan="3">Grand Total</td>
          <td style="text-align:right" class="highlight">${formatINR(order.grandTotal)}</td>
        </tr>
      </tbody>
    </table>
    ${order.shippingAddress ? `<p style="font-size:11px;color:#999;font-weight:700;letter-spacing:2px;margin-bottom:4px">SHIPPING TO</p>${addressBlock}` : ''}
    <hr class="divider" />
    <p>We will notify you once your order has been dispatched. Track your order from your account dashboard.</p>
    <a class="btn" href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard">View My Orders</a>
  `);

  return sendEmail({
    to,
    subject: `Order Confirmed — #${order.orderNumber} | MIRACLE`,
    html,
    text: `Order #${order.orderNumber} confirmed. Total: ${formatINR(order.grandTotal)}.`,
  });
};

// ─────────────────────────────────────────────────
// 3. Order Status Update Email
// ─────────────────────────────────────────────────
export const sendOrderStatusEmail = async (
  to: string,
  firstName: string,
  orderNumber: string,
  status: string,
  trackingNumber?: string
) => {
  const statusMessages: Record<string, string> = {
    PAID:      'Your payment has been confirmed and your order is now being prepared.',
    SHIPPED:   'Your order is on its way! Expect delivery within 3–5 business days.',
    DELIVERED: 'Your order has been delivered. We hope you love your new pieces.',
    CANCELLED: 'Your order has been cancelled. If you were charged, a refund will be processed within 5–7 business days.',
    REFUNDED:  'Your refund has been initiated. It will reflect in your account within 5–7 business days.',
  };

  const trackingHtml = (status === 'SHIPPED' && trackingNumber)
    ? `<p style="margin-top:12px">Tracking Reference: <span class="highlight">${trackingNumber}</span></p>`
    : '';

  const html = baseTemplate(`
    <h2>Order Update, ${firstName}.</h2>
    <p>Your order <span class="highlight">#${orderNumber}</span> status has been updated.</p>
    <p style="margin:20px 0">
      <span class="status-badge ${statusClass(status)}">${status}</span>
    </p>
    <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
    ${trackingHtml}
    <hr class="divider" />
    <a class="btn" href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard">View Order Details</a>
  `);

  return sendEmail({
    to,
    subject: `Your Order #${orderNumber} — ${status} | MIRACLE`,
    html,
    text: `Order #${orderNumber} is now ${status}. ${statusMessages[status] || ''}`,
  });
};

// ─────────────────────────────────────────────────
// 4. Password Reset Email
// ─────────────────────────────────────────────────
export const sendPasswordResetEmail = async (
  to: string,
  firstName: string,
  resetToken: string
) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

  const html = baseTemplate(`
    <h2>Reset Your Password.</h2>
    <p>Hello ${firstName}, we received a request to reset your MIRACLE account password.</p>
    <p>Click the button below to set a new password. This link expires in <span class="highlight">1 hour</span>.</p>
    <a class="btn" href="${resetUrl}">Reset Password</a>
    <hr class="divider" />
    <p style="font-size:11px;color:#999">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    <p style="font-size:11px;color:#999;margin-top:8px">Or copy this link: ${resetUrl}</p>
  `);

  return sendEmail({
    to,
    subject: 'Reset Your MIRACLE Password',
    html,
    text: `Reset your password at: ${resetUrl}. This link expires in 1 hour.`,
  });
};

// ─────────────────────────────────────────────────
// 5. Low Stock Alert Email (to Admin)
// ─────────────────────────────────────────────────
export const sendLowStockAlertEmail = async (
  adminEmail: string,
  products: Array<{ name: string; sku: string; stock: number }>
) => {
  const productRows = products
    .map(
      (p) => `
      <tr>
        <td>${p.name}</td>
        <td style="font-family:monospace">${p.sku}</td>
        <td style="text-align:center;color:#EF4444;font-weight:700">${p.stock} remaining</td>
      </tr>`
    )
    .join('');

  const html = baseTemplate(`
    <h2>⚠️ Low Stock Alert</h2>
    <p>The following products are running low on inventory and may require restocking:</p>
    <table class="order-table" style="margin-top:16px">
      <thead>
        <tr>
          <th>Product</th>
          <th>SKU</th>
          <th style="text-align:center">Stock Level</th>
        </tr>
      </thead>
      <tbody>${productRows}</tbody>
    </table>
    <hr class="divider" />
    <p>Log in to the admin portal to restock these items.</p>
    <a class="btn" href="http://localhost:3001">Open Admin Portal</a>
  `);

  return sendEmail({
    to: adminEmail,
    subject: `[MIRACLE Admin] Low Stock Alert — ${products.length} item${products.length > 1 ? 's' : ''} need restocking`,
    html,
    text: `Low stock alert for: ${products.map((p) => `${p.name} (${p.stock} left)`).join(', ')}`,
  });
};

// ─────────────────────────────────────────────────
// 6. Admin: New Order Notification
// ─────────────────────────────────────────────────
export const sendNewOrderAdminEmail = async (
  adminEmail: string,
  order: {
    orderNumber: string;
    grandTotal: number;
    userEmail: string;
    userName: string;
    itemCount: number;
  }
) => {
  const html = baseTemplate(`
    <h2>New Order Received</h2>
    <p>A new order has been placed on MIRACLE.</p>
    <hr class="divider" />
    <p><strong>Order:</strong> <span class="highlight">#${order.orderNumber}</span></p>
    <p><strong>Customer:</strong> ${order.userName} (${order.userEmail})</p>
    <p><strong>Items:</strong> ${order.itemCount} item${order.itemCount !== 1 ? 's' : ''}</p>
    <p><strong>Grand Total:</strong> <span class="highlight">${formatINR(order.grandTotal)}</span></p>
    <hr class="divider" />
    <a class="btn" href="http://localhost:3001">Manage in Admin Portal</a>
  `);

  return sendEmail({
    to: adminEmail,
    subject: `[MIRACLE Admin] New Order #${order.orderNumber} — ${formatINR(order.grandTotal)}`,
    html,
    text: `New order #${order.orderNumber} from ${order.userName} for ${formatINR(order.grandTotal)}.`,
  });
};
