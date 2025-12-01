// utils/cloudinaryUtils.js
const cloudinary = require('cloudinary').v2;

const uploadToCloudinary = async (file, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: resourceType,
      folder: 'assignments'
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file');
  }
};

module.exports = {
  uploadToCloudinary
};