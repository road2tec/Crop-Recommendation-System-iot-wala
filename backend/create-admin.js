/**
 * Create Admin User Script
 * Run this to create the default admin user automatically
 */

require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Crop_recommendation';

// Admin user details
const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin',
  isActive: true
};

async function createAdminUser() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import User model
    const User = require('./models/User');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists! Ensuring credentials are fresh.');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Role before refresh:', existingAdmin.role);
      console.log('✨ Status before refresh:', existingAdmin.isActive ? 'Active' : 'Inactive');

      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.password = adminUser.password;

      await existingAdmin.save();
      console.log('🔄 Existing admin credentials refreshed successfully');
    } else {
      // Create admin user (model handles password hashing)
      const admin = new User({
        name: adminUser.name,
        email: adminUser.email,
        password: adminUser.password,
        role: adminUser.role,
        isActive: adminUser.isActive,
        createdAt: new Date()
      });

      await admin.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n🎯 Admin Credentials:');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('🌐 Login URL: http://localhost:3000/login');
    console.log('\n🚀 You can now login with these credentials!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createAdminUser();