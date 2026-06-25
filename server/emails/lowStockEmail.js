const lowStockEmailTemplate = (items) => {
  const itemsHTML = items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 16px; border-bottom:1px solid #fef2f2; font-size:14px; color:#374151;">
        ${item.name}
      </td>
      <td style="padding:12px 16px; border-bottom:1px solid #fef2f2; font-size:14px; color:#374151; text-transform:capitalize;">
        ${item.category}
      </td>
      <td style="padding:12px 16px; border-bottom:1px solid #fef2f2; font-size:14px; text-align:center;">
        <span style="background:#fef2f2; color:#dc2626; padding:2px 10px; border-radius:20px; font-weight:700;">
          ${item.quantity} ${item.unit}
        </span>
      </td>
      <td style="padding:12px 16px; border-bottom:1px solid #fef2f2; font-size:14px; text-align:center; color:#6b7280;">
        ${item.threshold} ${item.unit}
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
  <title>Low Stock Alert</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 640px; margin: 40px auto; }
    .header { background: linear-gradient(135deg, #ef4444, #b91c1c); padding: 32px 20px; text-align: center; border-radius: 16px 16px 0 0; }
    .header h1 { color: white; font-size: 24px; font-weight: 800; }
    .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 6px; }
    .body { background: white; padding: 32px; border: 1px solid #e2e8f0; }
    .alert-banner { background:#fef2f2; border:2px solid #fca5a5; border-radius:10px; padding:16px; margin-bottom:24px; text-align:center; }
    .alert-banner p { color:#b91c1c; font-weight:600; font-size:15px; }
    table { width:100%; border-collapse:collapse; }
    th { background:#fef2f2; padding:10px 16px; text-align:left; font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:1px; }
    .footer { background:#f8fafc; padding:24px; text-align:center; border-radius:0 0 16px 16px; border:1px solid #e2e8f0; border-top:none; }
    .footer p { font-size:12px; color:#94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Low Stock Alert</h1>
      <p>Pizza App Inventory Management • ${new Date().toLocaleString('en-IN')}</p>
    </div>
    <div class="body">
      <div class="alert-banner">
        <p>🚨 ${items.length} item${items.length > 1 ? 's have' : ' has'} fallen below the minimum stock threshold</p>
      </div>

      <p style="font-size:15px; color:#374151; margin-bottom:20px;">
        The following inventory items need to be restocked immediately to ensure uninterrupted pizza delivery service:
      </p>

      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Category</th>
            <th style="text-align:center">Current Stock</th>
            <th style="text-align:center">Threshold</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>

      <p style="font-size:13px; color:#6b7280; margin-top:24px; text-align:center;">
        Please log in to the admin dashboard to update inventory levels.<br>
        Items will be automatically marked as unavailable when stock reaches zero.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated alert from Pizza App's inventory monitoring system.</p>
      <p style="margin-top:4px;">© ${new Date().getFullYear()} Pizza App Admin</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { lowStockEmailTemplate };