import PDFDocument from 'pdfkit';
import { Response } from 'express';

export const generateInvoicePDF = (order: any, res: Response) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Stream output directly to response
  doc.pipe(res);

  // Header / Branding
  doc
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .fontSize(24)
    .text('M I R A C L E', 50, 50);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#666666')
    .text('Discover the Extraordinary', 50, 78)
    .text('www.miracle.luxury', 50, 90);

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor('#111111')
    .text('INVOICE', 400, 50, { align: 'right' });

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#666666')
    .text(`Invoice No: INV-${order.orderNumber}`, 400, 72, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 84, { align: 'right' })
    .text(`Payment Status: ${order.paymentStatus}`, 400, 96, { align: 'right' });

  // Divider Line
  doc
    .strokeColor('#E8E8E8')
    .lineWidth(1)
    .moveTo(50, 125)
    .lineTo(550, 125)
    .stroke();

  // Billing & Shipping Info
  doc
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Billed To:', 50, 145)
    .text('Shipped To:', 300, 145);

  const billing = order.billingAddress || order.shippingAddress;
  const shipping = order.shippingAddress;

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#666666')
    // Billing Details
    .text(billing.name, 50, 160)
    .text(billing.street, 50, 172)
    .text(`${billing.city}, ${billing.state} ${billing.postalCode}`, 50, 184)
    .text(billing.country, 50, 196)
    .text(`Phone: ${billing.phone}`, 50, 208)
    // Shipping Details
    .text(shipping.name, 300, 160)
    .text(shipping.street, 300, 172)
    .text(`${shipping.city}, ${shipping.state} ${shipping.postalCode}`, 300, 184)
    .text(shipping.country, 300, 196)
    .text(`Phone: ${shipping.phone}`, 300, 208);

  // Table Headers
  const tableTop = 250;
  doc
    .fillColor('#111111')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('Item Description', 50, tableTop)
    .text('Price', 320, tableTop, { width: 60, align: 'right' })
    .text('Qty', 390, tableTop, { width: 40, align: 'right' })
    .text('Total', 480, tableTop, { width: 70, align: 'right' });

  // Table Divider
  doc
    .strokeColor('#111111')
    .lineWidth(1)
    .moveTo(50, 265)
    .lineTo(550, 265)
    .stroke();

  // Table Items
  let position = tableTop + 25;
  order.items.forEach((item: any, index: number) => {
    const itemTotal = item.price * item.quantity;
    const name = item.product.name;
    const desc = `${item.selectedColor || ''} ${item.selectedSize ? '/ Size ' + item.selectedSize : ''}`.trim();

    doc
      .fillColor('#111111')
      .font('Helvetica-Bold')
      .text(name, 50, position)
      .fillColor('#666666')
      .font('Helvetica')
      .fontSize(8)
      .text(desc, 50, position + 11)
      .fontSize(9)
      .text(`$${item.price.toFixed(2)}`, 320, position, { width: 60, align: 'right' })
      .text(item.quantity.toString(), 390, position, { width: 40, align: 'right' })
      .text(`$${itemTotal.toFixed(2)}`, 480, position, { width: 70, align: 'right' });

    position += 35;
  });

  // Table Bottom Divider
  doc
    .strokeColor('#E8E8E8')
    .lineWidth(1)
    .moveTo(50, position)
    .lineTo(550, position)
    .stroke();

  // Totals Area
  const totalsTop = position + 15;
  doc
    .font('Helvetica')
    .fillColor('#666666')
    .text('Subtotal:', 380, totalsTop, { width: 90, align: 'right' })
    .text(`$${order.totalAmount.toFixed(2)}`, 480, totalsTop, { width: 70, align: 'right' })

    .text('Discount:', 380, totalsTop + 15, { width: 90, align: 'right' })
    .text(`-$${order.discountAmount.toFixed(2)}`, 480, totalsTop + 15, { width: 70, align: 'right' })

    .text('Tax:', 380, totalsTop + 30, { width: 90, align: 'right' })
    .text(`$${order.taxAmount.toFixed(2)}`, 480, totalsTop + 30, { width: 70, align: 'right' })

    .text('Shipping:', 380, totalsTop + 45, { width: 90, align: 'right' })
    .text(`$${order.shippingCost.toFixed(2)}`, 480, totalsTop + 45, { width: 70, align: 'right' });

  // Grand Total Highlight
  doc
    .font('Helvetica-Bold')
    .fillColor('#111111')
    .fontSize(11)
    .text('Grand Total:', 380, totalsTop + 65, { width: 90, align: 'right' })
    .text(`$${order.grandTotal.toFixed(2)}`, 480, totalsTop + 65, { width: 70, align: 'right' });

  // Footer note
  doc
    .font('Helvetica-Oblique')
    .fontSize(8)
    .fillColor('#999999')
    .text('Thank you for choosing MIRACLE. Your order is being processed for shipping.', 50, totalsTop + 100, { align: 'center' });

  // End PDF stream
  doc.end();
};
