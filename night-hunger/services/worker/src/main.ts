import Queue = require('bull');
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
const telegramApiBaseUrl = process.env.TELEGRAM_API_BASE_URL || 'https://api.telegram.org';

interface TelegramSendResult {
  delivered: boolean;
  messageId?: number;
  reason?: string;
}

function normalizeUserId(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  return '';
}

async function sendTelegramMessage(
  userId: string,
  message: string,
): Promise<TelegramSendResult> {
  if (!telegramBotToken) {
    return { delivered: false, reason: 'TELEGRAM_BOT_TOKEN is not configured' };
  }

  if (!userId) {
    return { delivered: false, reason: 'Invalid userId' };
  }

  const endpoint = `${telegramApiBaseUrl}/bot${telegramBotToken}/sendMessage`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: userId,
      text: message,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const payload = (await response.json()) as {
    ok?: boolean;
    description?: string;
    result?: { message_id?: number };
    error_code?: number;
  };

  if (response.ok && payload.ok) {
    return {
      delivered: true,
      messageId: payload.result?.message_id,
    };
  }

  const reason = payload.description || `HTTP ${response.status}`;

  if (response.status >= 500 || response.status === 429) {
    throw new Error(`Telegram temporary error: ${reason}`);
  }

  return { delivered: false, reason };
}

// ============================================
// Notification Queue
// ============================================
const notificationQueue = new Queue('notifications', redisUrl);

notificationQueue.process(async (job: Queue.Job) => {
  const { userId, message, type, priority } = job.data || {};
  const targetUserId = normalizeUserId(userId);

  console.log(`[Notification] Sending to user ${targetUserId}: ${message}`);
  console.log(`[Notification] Type: ${type}, Priority: ${priority}`);

  const delivery = await sendTelegramMessage(targetUserId, String(message || ''));

  if (!delivery.delivered) {
    console.warn(
      `[Notification] Delivery skipped/failed for user ${targetUserId}: ${delivery.reason}`,
    );
  }

  return {
    success: delivery.delivered,
    userId: targetUserId,
    messageId: delivery.messageId ?? null,
    reason: delivery.reason ?? null,
  };
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
  const targetUserId = normalizeUserId(userId);

  console.log(`[Reminder] Sending to user ${targetUserId}: ${message}`);
  console.log(`[Reminder] Type: ${type}`);

  const delivery = await sendTelegramMessage(targetUserId, String(message || ''));

  if (!delivery.delivered) {
    console.warn(
      `[Reminder] Delivery skipped/failed for user ${targetUserId}: ${delivery.reason}`,
    );
  }

  return {
    success: delivery.delivered,
    userId: targetUserId,
    messageId: delivery.messageId ?? null,
    reason: delivery.reason ?? null,
  };
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
  console.log(
    `[Worker] Telegram delivery: ${telegramBotToken ? 'enabled' : 'disabled (no token)'}`,
  );

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
