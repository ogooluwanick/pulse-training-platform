// lib/cloudinary.ts

import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with credentials from environment variables
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_KEY, 
    api_secret: process.env.CLOUD_KEY_SECRET 
});

export default cloudinary;
