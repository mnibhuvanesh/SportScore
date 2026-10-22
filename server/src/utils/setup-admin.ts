import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { hashPassword } from './security';
import { env } from '../config/env';

async function main(): Promise<void> {
  await connectDatabase();

  const email = (process.argv[2] || env.ADMIN_EMAIL || 'admin@sportsplatform.edu').toLowerCase().trim();
  const password = process.argv[3] || env.ADMIN_PASSWORD;
  const name = process.argv[4] || env.ADMIN_NAME || 'Bhuvanesh Saminathan';
  const username = process.argv[5] || 'bhuvanesh';

  let admin = await User.findOne({ role: 'ADMIN' });

  if (!admin) {
    const passToHash = password || env.DEMO_ADMIN_PASSWORD || 'AdminSecurePass2026!';
    admin = await User.create({
      name,
      email,
      username,
      passwordHash: await hashPassword(passToHash),
      role: 'ADMIN',
      status: 'ACTIVE',
      phone: '+91 98401 23456',
    });
    console.log(`✅ Administrator created successfully: ${admin.name} (${admin.email}, username: ${admin.username})`);
  } else {
    admin.name = name;
    admin.email = email;
    admin.username = username;
    admin.phone = '+91 98401 23456';
    if (password) {
      admin.passwordHash = await hashPassword(password);
      console.log('🔒 Password securely updated using bcrypt hash (work factor 12)');
    }
    await admin.save();
    console.log(`✅ Administrator updated successfully: ${admin.name} (${admin.email}, username: ${admin.username})`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Admin setup error:', err);
  process.exit(1);
});
