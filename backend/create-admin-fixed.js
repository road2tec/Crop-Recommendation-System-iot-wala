/**
 * FIXED Admin User Creation Script
 * Handles the password hashing correctly to avoid double-hashing
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function createAdminUserFixed() {
  try {
    console.log('🚀 FIXED ADMIN CREATION SCRIPT');
    console.log('=====================================\n');
    
    console.log('🔗 Connecting to MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Crop_recommendation';
    console.log('MongoDB URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Import User model
    const User = require('./models/User');

    // Admin user details
    const adminData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123', // DON'T hash manually - let the model do it
      role: 'admin',
      isActive: true
    };

    console.log('🔍 Checking for existing admin user...');
    
    // Delete any existing admin user to start fresh
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('🗑️  Removing existing admin user to start fresh...');
      await User.deleteOne({ email: adminData.email });
      console.log('✅ Existing admin user removed');
    }

    console.log('\n🆕 Creating fresh admin user...');
    
    // Create new admin user (let the model handle password hashing)
    const admin = new User(adminData);
    await admin.save(); // This will trigger the pre-save hook to hash password
    
    console.log('✅ Admin user created successfully!');

    // Verify the admin user
    console.log('\n🔍 Verifying admin user...');
    const verifyAdmin = await User.findOne({ email: adminData.email });
    
    if (!verifyAdmin) {
      throw new Error('Admin user verification failed!');
    }
    
    console.log('✅ Admin user found in database:');
    console.log('   📧 Email:', verifyAdmin.email);
    console.log('   👤 Name:', verifyAdmin.name);
    console.log('   🔑 Role:', verifyAdmin.role);
    console.log('   ✨ Active:', verifyAdmin.isActive);
    console.log('   🔐 Password hash:', verifyAdmin.password.substring(0, 20) + '...');
    
    // Test password comparison
    console.log('\n🔍 Testing password...');
    const isPasswordValid = await verifyAdmin.comparePassword('admin123');
    
    if (!isPasswordValid) {
      throw new Error('Password verification failed!');
    }
    
    console.log('✅ Password verification successful!');
    
    // Test JWT token generation
    console.log('\n🔍 Testing JWT token generation...');
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'your_secret_key';
    
    const token = jwt.sign(
      { userId: verifyAdmin._id, role: verifyAdmin.role },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    console.log('✅ JWT token generated successfully');
    console.log('   Token preview:', token.substring(0, 50) + '...');

    console.log('\n🎉 ADMIN USER READY!');
    console.log('=====================================');
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('🌐 Frontend URL: http://localhost:3000/login');
    console.log('🎯 After login, you should be redirected to: /admin');
    console.log('=====================================\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Ensure MongoDB is running: mongod');
    console.log('2. Check backend server: npm run dev');
    console.log('3. Check .env file for correct MONGODB_URI');
    
  } finally {
    try {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    } catch (e) {
      console.log('🔌 Already disconnected from MongoDB');
    }
    process.exit(0);
  }
}

// Run the script
createAdminUserFixed();