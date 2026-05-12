/**
 * Seed script — optional. Run with: node utils/seedData.js
 * Creates a few sample users and clubs for testing.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Club = require('../models/Club');
const Activity = require('../models/Activity');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (use with caution)
    await User.deleteMany();
    await Club.deleteMany();
    await Activity.deleteMany();
    console.log('Cleared old data');

    // Create users
    const admin = await User.create({
      name: 'Aarav Sharma',
      email: 'admin@example.com',
      password: 'password123',
      department: 'CSE',
      role: 'admin',
      departmentId: 'CSE-2024-ADMIN',
      interests: ['coding', 'ai', 'web'],
    });

    const user1 = await User.create({
      name: 'Priya Patel',
      email: 'priya@example.com',
      password: 'password123',
      department: 'ECE',
      interests: ['robotics', 'electronics'],
    });

    const user2 = await User.create({
      name: 'Rohan Kumar',
      email: 'rohan@example.com',
      password: 'password123',
      department: 'CSE',
      interests: ['coding', 'gaming'],
    });

    console.log('Created users');

    // Create clubs
    const codingClub = await Club.create({
      name: 'Coding Club',
      description:
        'Weekly coding sessions, hackathons, and competitive programming.',
      department: 'CSE',
      category: 'Technical',
      tags: ['coding', 'programming', 'algorithms'],
      admin: admin._id,
      members: [admin._id, user2._id],
    });

    const roboticsClub = await Club.create({
      name: 'Robotics Society',
      description:
        'Build robots, compete in international competitions, and explore embedded systems.',
      department: 'ECE',
      category: 'Technical',
      tags: ['robotics', 'embedded', 'electronics'],
      admin: admin._id,
      members: [admin._id, user1._id],
    });

    const literaryClub = await Club.create({
      name: 'Literary Society',
      description: 'Poetry slams, debates, creative writing workshops, and book clubs.',
      department: 'OTHER',
      category: 'Literary',
      tags: ['writing', 'poetry', 'debate'],
      admin: admin._id,
      members: [admin._id],
    });

    // Update users with joined clubs
    admin.joinedClubs = [codingClub._id, roboticsClub._id, literaryClub._id];
    user1.joinedClubs = [roboticsClub._id];
    user2.joinedClubs = [codingClub._id];
    await admin.save();
    await user1.save();
    await user2.save();

    console.log('Created clubs');

    // Create activities
    await Activity.create([
      {
        club: codingClub._id,
        author: admin._id,
        type: 'announcement',
        title: 'Welcome to the Coding Club!',
        content:
          'Excited to welcome all new members. Our first session is this Friday at 5 PM in Lab 3.',
      },
      {
        club: codingClub._id,
        author: admin._id,
        type: 'event',
        title: 'HackBattle 2024',
        content:
          '24-hour hackathon with prizes worth ₹50,000. Register before the 15th.',
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        eventLocation: 'Main Auditorium',
      },
      {
        club: roboticsClub._id,
        author: admin._id,
        type: 'post',
        title: 'New Arduino kits arrived',
        content:
          'Just got 20 new Arduino UNO kits. Members can borrow them from the club room.',
      },
    ]);

    console.log('Created activities');
    console.log('\n✅ Seed complete!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@example.com / password123');
    console.log('User:  priya@example.com / password123');
    console.log('User:  rohan@example.com / password123');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seed();
