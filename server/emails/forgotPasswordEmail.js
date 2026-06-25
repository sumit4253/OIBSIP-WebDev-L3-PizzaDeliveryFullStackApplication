const forgotPasswordEmailTemplate = (name, otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 40px auto; }
    .header {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      padding: 40px 20px;
      text-align: center;
      border-radius: 16px 16px 0 0;
    }
    .header h1 { color: white; font-size: 26px; font-weight: 800; }
    .header p  { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 4px; }
    .body { background: white; padding: 40px 32px; border: 1px solid #e2e8f0; border-top: none; }
    .greeting { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
    .text { font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 16px; }
    .otp-box {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border: 2px dashed #3b82f6;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-label { font-size: 12px; color: #64748b; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; }
    .otp-code  { font-size: 42px; font-weight: 800; color: #2563eb; letter-spacing: 8px; margin: 8px 0; }
    .otp-expiry { font-size: 12px; color: #94a3b8; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #b91c1c; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; }
    .footer p { font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Password Reset</h1>
      <p>Pizza App Account Security</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${name}!</p>
      <p class="text">We received a request to reset the password for your Pizza App account. Use the OTP below to reset your password. This code is valid for <strong>10 minutes</strong> only.</p>

      <div class="otp-box">
        <p class="otp-label">Password Reset OTP</p>
        <p class="otp-code">${otp}</p>
        <p class="otp-expiry">⏱ Expires in 10 minutes</p>
      </div>

      <p class="text">If you didn't request a password reset, please ignore this email or contact support if you believe your account is at risk.</p>

      <hr class="divider">

      <div class="warning">
        ⚠️ <strong>Security Notice:</strong> Never share this OTP with anyone. Pizza App will never ask for this code.
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Pizza App. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { forgotPasswordEmailTemplate };