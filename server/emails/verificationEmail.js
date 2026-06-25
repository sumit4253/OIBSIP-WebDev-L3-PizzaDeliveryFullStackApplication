/**
 * Email verification template
 * Beautiful HTML email with OTP
 */
const verificationEmailTemplate = (name, otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 40px auto; }
    .header {
      background: linear-gradient(135deg, #f97316, #dc2626);
      padding: 40px 20px;
      text-align: center;
      border-radius: 16px 16px 0 0;
    }
    .header h1 { color: white; font-size: 28px; font-weight: 800; }
    .header p  { color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 4px; }
    .body {
      background: white;
      padding: 40px 32px;
      border-left: 1px solid #e2e8f0;
      border-right: 1px solid #e2e8f0;
    }
    .greeting { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
    .text     { font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 16px; }
    .otp-box {
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
      border: 2px dashed #f97316;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-label { font-size: 12px; color: #64748b; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; }
    .otp-code  { font-size: 42px; font-weight: 800; color: #ea580c; letter-spacing: 8px; margin: 8px 0; }
    .otp-expiry { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #b91c1c; }
    .footer {
      background: #f8fafc;
      padding: 24px 32px;
      text-align: center;
      border-radius: 0 0 16px 16px;
      border: 1px solid #e2e8f0;
      border-top: none;
    }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.6; }
    .pizza-emoji { font-size: 48px; display: block; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="pizza-emoji">🍕</span>
      <h1>Pizza App</h1>
      <p>Your favourite pizzas, delivered fresh</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${name}! 👋</p>
      <p class="text">Welcome to Pizza App! We're thrilled to have you on board. To complete your registration and start ordering delicious pizzas, please verify your email address using the OTP below.</p>

      <div class="otp-box">
        <p class="otp-label">Your Verification Code</p>
        <p class="otp-code">${otp}</p>
        <p class="otp-expiry">⏱ This code expires in <strong>10 minutes</strong></p>
      </div>

      <p class="text">Enter this code on the verification page to activate your account. If you didn't create a Pizza App account, you can safely ignore this email.</p>

      <hr class="divider">

      <div class="warning">
        🔒 <strong>Never share this OTP</strong> with anyone. Our team will never ask for your verification code.
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Pizza App. All rights reserved.</p>
      <p style="margin-top:4px;">Made with ❤️ and 🍕 for pizza lovers</p>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = { verificationEmailTemplate };