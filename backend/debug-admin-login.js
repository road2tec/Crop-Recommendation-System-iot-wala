/**
 * Debug Admin Login Script
 * This script will help diagnose the admin login issue
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function debugAdminLogin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Crop_recommendation');
    console.log('✅ Connected to MongoDB');

    const User = require('./models/User');

    // Test credentials
    const testEmail = 'admin@example.com';
    const testPassword = 'admin123';

    console.log('\n📧 Testing login with credentials:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);

    // Step 1: Check if admin user exists
    console.log('\n🔍 Step 1: Checking if admin user exists...');
    const admin = await User.findOne({ email: testEmail });
    
    if (!admin) {
      console.log('❌ Admin user NOT found in database!');
      console.log('🔍 Let me check all users...');
      
      const allUsers = await User.find({}).select('email name role isActive');
      console.log('\n📋 All users in database:');
      if (allUsers.length === 0) {
        console.log('   No users found in database.');
      } else {
        allUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} | ${user.name} | ${user.role} | ${user.isActive ? 'Active' : 'Inactive'}`);
        });
      }
      console.log('\n💡 SOLUTION: Run create-admin.bat to create the admin user');
      return;
    }

    console.log('✅ Admin user found!');
    console.log('   Name:', admin.name);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Active:', admin.isActive);
    console.log('   Created:', admin.createdAt);
    console.log('   Last Login:', admin.lastLogin || 'Never');

    // Step 2: Check if account is active
    console.log('\n🔍 Step 2: Checking if account is active...');
    if (!admin.isActive) {
      console.log('❌ Admin account is DEACTIVATED!');
      console.log('💡 SOLUTION: Activate the admin account');
      return;
    }
    console.log('✅ Admin account is active');

    // Step 3: Test password
    console.log('\n🔍 Step 3: Testing password...');
    const isPasswordValid = await admin.comparePassword(testPassword);
    
    if (!isPasswordValid) {
      console.log('❌ Password does NOT match!');
      console.log('🔐 Stored password hash:', admin.password.substring(0, 20) + '...');
      
      // Try to hash the test password and compare
      const testHash = await bcrypt.hash(testPassword, 10);
      console.log('🔐 Test password hash:', testHash.substring(0, 20) + '...');
      
      console.log('💡 SOLUTION: Reset admin password or check if password was changed');
      return;
    }
    console.log('✅ Password matches!');

    // Step 4: Check JWT Secret
    console.log('\n🔍 Step 4: Checking JWT configuration...');
    const jwtSecret = process.env.JWT_SECRET || 'your_secret_key';
    console.log('JWT Secret configured:', jwtSecret ? 'Yes' : 'No');
    console.log('JWT Secret length:', jwtSecret.length);

    // Step 5: Simulate login process
    console.log('\n🔍 Step 5: Simulating complete login process...');
    const jwt = require('jsonwebtoken');
    
    try {
      // Generate token (same as in authController)
      const token = jwt.sign(
        { userId: admin._id, role: admin.role },
        jwtSecret,
        { expiresIn: '7d' }
      );
      
      console.log('✅ JWT Token generated successfully');
      console.log('   Token preview:', token.substring(0, 50) + '...');
      
      // Verify token
      const decoded = jwt.verify(token, jwtSecret);
      console.log('✅ JWT Token verified successfully');
      console.log('   Decoded user ID:', decoded.userId);
      console.log('   Decoded role:', decoded.role);
      
      // Update last login
      admin.lastLogin = new Date();
      await admin.save();
      console.log('✅ Last login updated');
      
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('🤔 If login still fails, the issue might be:');
      console.log('   1. Frontend not sending correct API request');
      console.log('   2. CORS configuration issue');
      console.log('   3. Backend server not running');
      console.log('   4. Database connection issue during actual login');
      console.log('   5. Frontend routing/redirect issue');
      
    } catch (jwtError) {
      console.log('❌ JWT Token error:', jwtError.message);
    }

  } catch (error) {
    console.error('❌ Error during debug:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the debug script
debugAdminLogin();