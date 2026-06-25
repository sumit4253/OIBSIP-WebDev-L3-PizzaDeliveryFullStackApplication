const cloudinary = require('cloudinary').v2;

/**
 * Configure Cloudinary for image uploads
 * Falls back gracefully if credentials not provided
 */
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });

  console.log('✅ Cloudinary configured');
} else {
  console.log('ℹ️  Cloudinary not configured — using local file storage');
}

module.exports = cloudinary;