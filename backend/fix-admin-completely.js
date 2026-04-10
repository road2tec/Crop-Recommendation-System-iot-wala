/**
 * COMPREHENSIVE Admin User Creation & Fix Script
 * This script will definitely create/fix the admin user
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Admin user details
const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'admin123',
  role: 'admin',
  isActive: true
};

async function createOrFixAdminUser() {
  try {
    console.log('🚀 COMPREHENSIVE ADMIN FIX SCRIPT');
    console.log('=====================================\n');
    
    console.log('🔗 Connecting to MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Crop_recommendation';
    console.log('MongoDB URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Import User model
    const User = require('./models/User');

    // STEP 1: Check existing admin
    console.log('🔍 STEP 1: Checking existing admin user...');
    const existingAdmin = await User.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('   📧 Email:', existingAdmin.email);
      console.log('   👤 Name:', existingAdmin.name);
      console.log('   🔑 Role:', existingAdmin.role);
      console.log('   ✨ Active:', existingAdmin.isActive);
      console.log('   📅 Created:', existingAdmin.createdAt);
      
      // STEP 2: Force reset the admin user
      console.log('\n🔄 STEP 2: Force updating admin user...');
      
      // Update all fields to ensure correct state (password stays plain so the model hashes it)
      existingAdmin.name = adminUser.name;
      existingAdmin.password = adminUser.password;
      existingAdmin.role = adminUser.role;
      existingAdmin.isActive = adminUser.isActive;
      existingAdmin.lastLogin = null; // Reset last login
      
      await existingAdmin.save();
      console.log('✅ Admin user updated and password reset!');
      
    } else {
      // STEP 2: Create new admin user
      console.log('❌ Admin user NOT found in database');
      console.log('\n🆕 STEP 2: Creating new admin user...');
      
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
      console.log('✅ New admin user created successfully!');
    }

    // STEP 3: Verify the admin user
    console.log('\n🔍 STEP 3: Verifying admin user...');
    const verifyAdmin = await User.findOne({ email: adminUser.email });
    
    if (!verifyAdmin) {
      throw new Error('Admin user verification failed!');
    }
    
    console.log('✅ Admin user verified in database');
    console.log('   📧 Email:', verifyAdmin.email);
    console.log('   👤 Name:', verifyAdmin.name);
    console.log('   🔑 Role:', verifyAdmin.role);
    console.log('   ✨ Active:', verifyAdmin.isActive);
    
    // STEP 4: Test password
    console.log('\n🔍 STEP 4: Testing password...');
    const isPasswordValid = await verifyAdmin.comparePassword(adminUser.password);
    
    if (!isPasswordValid) {
      throw new Error('Password verification failed!');
    }
    
    console.log('✅ Password verification successful');
    
    // STEP 5: Test JWT token generation
    console.log('\n🔍 STEP 5: Testing JWT token generation...');
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.JWT_SECRET || 'your_secret_key';
    
    const token = jwt.sign(
      { userId: verifyAdmin._id, role: verifyAdmin.role },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    // Verify token
    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ JWT token generation and verification successful');
    console.log('   Token preview:', token.substring(0, 50) + '...');
    console.log('   Decoded user ID:', decoded.userId);
    console.log('   Decoded role:', decoded.role);

    console.log('\n🎉 SUCCESS! Admin user is ready to use!');
    console.log('=====================================');
    console.log('🔐 LOGIN CREDENTIALS:');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('🌐 Login URL: http://localhost:3000/login');
    console.log('🎯 Admin Dashboard: http://localhost:3000/admin');
    console.log('=====================================\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Check .env file for correct MONGODB_URI');
    console.log('3. Ensure User model is properly defined');
    console.log('4. Try restarting MongoDB service');
    
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createOrFixAdminUser();