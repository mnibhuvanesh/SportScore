import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { hashPassword } from './security';
import { env } from '../config/env';

async function main(): Promise<void> {
  const email = (process.argv[2] || env.ADMIN_EMAIL || 'admin@example.com').toLowerCase().trim();
  const password = process.argv[3] || env.ADMIN_PASSWORD;
  const name = process.argv[4] || env.ADMIN_NAME || 'Platform Administrator';
  const username = process.argv[5] || 'admin';
  if (!password) {
    throw new Error('Provide an administrator password as an argument or set ADMIN_PASSWORD.');
  }
  await connectDatabase();

  let admin = await User.findOne({ role: 'ADMIN' });

  if (!admin) {
    admin = await User.create({
      name,
      email,
      username,
      passwordHash: await hashPassword(password),
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    console.log(`✅ Administrator created successfully: ${admin.name} (${admin.email}, username: ${admin.username})`);
  } else {
    admin.name = name;
    admin.email = email;
    admin.username = username;
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
