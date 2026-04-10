/**
 * Check Admin User Script
 * Verify if admin user exists and get details
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function checkAdminUser() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Crop_recommendation');
    console.log('✅ Connected to MongoDB');

    const User = require('./models/User');

    // Check admin user
    const admin = await User.findOne({ email: 'admin@example.com' }).select('-password');
    
    if (admin) {
      console.log('✅ Admin user found!');
      console.log('📧 Email:', admin.email);
      console.log('👤 Name:', admin.name);
      console.log('🔑 Role:', admin.role);
      console.log('✨ Active:', admin.isActive);
      console.log('📅 Created:', admin.createdAt);
      console.log('⏰ Last Login:', admin.lastLogin || 'Never');
    } else {
      console.log('❌ Admin user NOT found!');
      console.log('🔍 Let me check all users...');
      
      const allUsers = await User.find({}).select('email name role isActive');
      console.log('\n📋 All users in database:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} | ${user.name} | ${user.role} | ${user.isActive ? 'Active' : 'Inactive'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkAdminUser();