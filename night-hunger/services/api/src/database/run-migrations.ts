import { DataSource, DataSourceOptions } from 'typeorm';
import { User, Inventory, GameLog, Referral } from './entities';
import runSeed from './seeds';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'night_hunger',
  entities: [User, Inventory, GameLog, Referral],
  migrations: ['src/database/migrations/*.ts'],
});

async function runMigrations() {
  try {
    await dataSource.initialize();
    console.log('Database connected successfully!');

    // Run migrations
    const migrations = await dataSource.runMigrations();
    console.log('Migrations completed:', migrations);

    // Run seeds
    await runSeed(dataSource);

    await dataSource.destroy();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
