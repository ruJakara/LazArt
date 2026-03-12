import { DataSource } from 'typeorm';
import { User } from '../entities';
import { seedItemsAndShops } from './items.shops.seed';

export default async function runSeed(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // Seed items and shops first
  console.log('Seeding items and shops...');
  await seedItemsAndShops(dataSource.createQueryRunner());

  // Check if users already exist
  const existingUser = await userRepository.count();
  if (existingUser > 0) {
    console.log('Users already exist. Skipping user seed...');
    return;
  }

  // Create test users
  const testUsers = [
    {
      id: '123456789',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      language_code: 'ru',
      blood_balance: 500,
      xp: 1500,
      level: 5,
      stats_strength: 10,
      stats_agility: 8,
      stats_hp: 150,
      current_hp: 120,
      skin_id: 'default',
      referral_code: 'TEST123',
    },
    {
      id: '987654321',
      username: 'vampireLord',
      first_name: 'Vampire',
      last_name: 'Lord',
      language_code: 'en',
      blood_balance: 2500,
      xp: 15000,
      level: 15,
      stats_strength: 25,
      stats_agility: 20,
      stats_hp: 300,
      current_hp: 280,
      skin_id: 'vampire_lord',
      referral_code: 'VLORD987',
    },
    {
      id: '555555555',
      username: 'nightHunter',
      first_name: 'Night',
      last_name: 'Hunter',
      language_code: 'ru',
      blood_balance: 1200,
      xp: 5000,
      level: 8,
      stats_strength: 15,
      stats_agility: 12,
      stats_hp: 200,
      current_hp: 200,
      skin_id: 'night_stalker',
      referral_code: 'HUNT555',
    },
  ];

  for (const userData of testUsers) {
    const user = userRepository.create(userData);
    await userRepository.save(user);
    console.log(`Created user: ${userData.username}`);
  }

  console.log('Seed completed successfully!');
}
