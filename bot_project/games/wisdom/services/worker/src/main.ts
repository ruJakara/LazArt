import Queue = require('bull');
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// ============================================
// Notification Queue
// ============================================
const notificationQueue = new Queue('notifications', redisUrl);

notificationQueue.process(async (job: Queue.Job) => {
  const { userId, message, type, priority } = job.data || {};

  console.log(`[Notification] Sending to user ${userId}: ${message}`);
  console.log(`[Notification] Type: ${type}, Priority: ${priority}`);

  // TODO: Integrate Telegram Bot API to send notifications.
  return { success: true, userId, messageId: `msg_${Date.now()}` };
});

notificationQueue.on('completed', (job: Queue.Job) => {
  console.log(`[Notification] Job ${job.id} completed`);
});

notificationQueue.on('failed', (job: Queue.Job | undefined, error: Error) => {
  console.error(`[Notification] Job ${job?.id} failed:`, error.message);
});

// ============================================
// Reminder Queue
// ============================================
const reminderQueue = new Queue('reminder', redisUrl);

reminderQueue.process(async (job: Queue.Job) => {
  const { userId, message, type } = job.data || {};

  console.log(`[Reminder] Sending to user ${userId}: ${message}`);
  console.log(`[Reminder] Type: ${type}`);

  // TODO: Integrate Telegram Bot API for reminders.
  return { success: true, userId, messageId: `msg_${Date.now()}` };
});

reminderQueue.on('completed', (job: Queue.Job) => {
  console.log(`[Reminder] Job ${job.id} completed`);
});

reminderQueue.on('failed', (job: Queue.Job | undefined, error: Error) => {
  console.error(`[Reminder] Job ${job?.id} failed:`, error.message);
});

// ============================================
// Leaderboard Cache Queue
// ============================================
const leaderboardQueue = new Queue('leaderboard', redisUrl);

leaderboardQueue.process(async () => {
  console.log('[Leaderboard] Updating leaderboard cache...');

  const redisClient = createClient({ url: redisUrl });
  await redisClient.connect();

  try {
    const cacheKey = 'leaderboard:global:xp:100:0';
    const leaderboardData = JSON.stringify([
      { rank: 1, userId: 123, username: 'top_player', totalXp: 10000 },
    ]);

    await redisClient.setEx(cacheKey, 300, leaderboardData);
    console.log('[Leaderboard] Cache updated successfully');
  } catch (error) {
    console.error('[Leaderboard] Cache update failed:', error);
    throw error;
  } finally {
    await redisClient.disconnect();
  }
});

leaderboardQueue.on('completed', (job: Queue.Job) => {
  console.log(`[Leaderboard] Job ${job.id} completed`);
});

leaderboardQueue.on('failed', (job: Queue.Job | undefined, error: Error) => {
  console.error(`[Leaderboard] Job ${job?.id} failed:`, error.message);
});

// ============================================
// Cleanup Queue
// ============================================
const cleanupQueue = new Queue('cleanup', redisUrl);

cleanupQueue.process(async () => {
  console.log('[Cleanup] Running cleanup tasks...');

  // TODO: Cleanup old sessions and expired data:
  // - Remove stale payment records
  // - Remove expired reminder jobs
  // - Clear old cache entries

  return { success: true };
});

cleanupQueue.on('completed', (job: Queue.Job) => {
  console.log(`[Cleanup] Job ${job.id} completed`);
});

cleanupQueue.on('failed', (job: Queue.Job | undefined, error: Error) => {
  console.error(`[Cleanup] Job ${job?.id} failed:`, error.message);
});

// ============================================
// Schedule Recurring Jobs
// ============================================
async function scheduleJobs() {
  console.log('[Worker] Scheduling recurring jobs...');

  await leaderboardQueue.add(
    {},
    {
      repeat: { every: 300000 }, // 5 minutes
      jobId: 'leaderboard-cache',
    },
  );

  await cleanupQueue.add(
    {},
    {
      repeat: { every: 3600000 }, // 1 hour
      jobId: 'cleanup-hourly',
    },
  );

  await reminderQueue.add(
    { type: 'daily_reminder' },
    {
      repeat: { cron: '0 18 * * *' }, // Daily at 18:00
      jobId: 'reminder-daily-18',
    },
  );

  console.log('[Worker] Jobs scheduled successfully');
}

// ============================================
// Main
// ============================================
async function main() {
  console.log('[Worker] Starting worker service...');
  console.log('[Worker] Redis URL:', redisUrl);

  await scheduleJobs();

  console.log('[Worker] Worker service started successfully');
}

main().catch((error) => {
  console.error('[Worker] Fatal error:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...');
  await notificationQueue.close();
  await reminderQueue.close();
  await leaderboardQueue.close();
  await cleanupQueue.close();
  process.exit(0);
});
