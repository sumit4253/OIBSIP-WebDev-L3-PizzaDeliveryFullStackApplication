const orderConfirmEmailTemplate = (name, order) => {
  const itemsHTML = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px;">
        ${item.name} (${item.size})
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; text-align: right;">
        ₹${item.subtotal}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 40px auto; }
    .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 40px 20px; text-align: center; border-radius: 16px 16px 0 0; }
    .header h1 { color: white; font-size: 26px; font-weight: 800; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 4px; }
    .body { background: white; padding: 32px; border: 1px solid #e2e8f0; }
    .order-number { background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px; }
    .order-number span { font-size: 22px; font-weight: 800; color: #16a34a; letter-spacing: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
    .total-row td { padding: 12px 16px; font-weight: 700; color: #1e293b; font-size: 16px; border-top: 2px solid #e2e8f0; }
    .address-box { background: #f8fafc; border-radius: 10px; padding: 16px; margin: 20px 0; }
    .address-box h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px; }
    .address-box p { font-size: 14px; color: #334155; line-height: 1.6; }
    .eta-box { background: #fff7ed; border: 2px solid #fb923c; border-radius: 10px; padding: 16px; text-align: center; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; }
    .footer p { font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Confirmed!</h1>
      <p>Your pizza is on its way</p>
    </div>
    <div class="body">
      <p style="font-size:16px; font-weight:600; color:#1e293b; margin-bottom:20px;">
        Hi ${name}! 🎉
      </p>
      <p style="font-size:14px; color:#475569; margin-bottom:24px;">
        Great news! Your order has been received and our kitchen is getting to work. Here's a summary:
      </p>

      <div class="order-number">
        <p style="font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:1px;">Order Number</p>
        <span>${order.orderNumber}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
          <tr>
            <td style="padding:8px 16px; font-size:14px; color:#64748b;">Delivery Fee</td>
            <td></td>
            <td style="padding:8px 16px; text-align:right; font-size:14px; color:#64748b;">₹${order.pricing.deliveryFee}</td>
          </tr>
          <tr>
            <td style="padding:8px 16px; font-size:14px; color:#64748b;">Tax (GST 18%)</td>
            <td></td>
            <td style="padding:8px 16px; text-align:right; font-size:14px; color:#64748b;">₹${order.pricing.tax}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="2">Total</td>
            <td style="text-align:right; color:#ea580c;">₹${order.pricing.total}</td>
          </tr>
        </tfoot>
      </table>

      <div class="address-box">
        <h3>🏠 Delivery Address</h3>
        <p>${order.deliveryAddress.name} | ${order.deliveryAddress.phone}</p>
        <p>${order.deliveryAddress.street}, ${order.deliveryAddress.city}</p>
        <p>${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}</p>
      </div>

      <div class="eta-box">
        <p style="font-size:13px; color:#92400e; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Estimated Delivery Time</p>
        <p style="font-size:24px; font-weight:800; color:#ea580c; margin-top:4px;">~45 Minutes 🚴</p>
      </div>

      <p style="font-size:13px; color:#64748b; text-align:center;">
        Track your order in real-time on the Pizza App.<br>
        Payment: ${order.payment.method === 'razorpay' ? '💳 Online Payment' : '💵 Cash on Delivery'}
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Pizza App. All rights reserved.</p>
      <p style="margin-top:4px;">🍕 Thank you for ordering with us!</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { orderConfirmEmailTemplate };