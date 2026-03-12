import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, GameLog } from '../../src/database/entities';

describe('Game E2E (critical path)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const testUserId = 123456789n;
  const testUser = {
    id: testUserId,
    username: 'e2e_test_player',
    first_name: 'E2E',
    last_name: null,
    language_code: 'ru',
    blood_balance: 100,
    xp: 0,
    level: 1,
    stats_strength: 10,
    stats_agility: 10,
    stats_hp: 100,
    current_hp: 100,
    stat_points: 0,
    skin_id: 'default',
    is_premium: false,
    premium_expires_at: null,
    referral_code: 'e2etest',
    referred_by: null,
    last_login: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue({
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
      })
      .overrideProvider(getRepositoryToken(GameLog))
      .useValue({
        create: jest.fn(),
        save: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/game/hunt (Auth → Hunt)', () => {
    it('should start a hunt successfully', async () => {
      // Mock user exists and is alive
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        ...testUser,
        current_hp: 100,
      });

      const response = await request(app.getHttpServer())
        .get('/api/game/hunt')
        .set('Authorization', 'Bearer fake_jwt_token')
        .expect(200);

      expect(response.body).toHaveProperty('enemy');
      expect(response.body.enemy).toHaveProperty('type');
      expect(response.body.enemy).toHaveProperty('hp');
      expect(response.body.enemy).toHaveProperty('damage');
      expect(response.body).toHaveProperty('canAttack', true);
    });

    it('should reject hunt if user is dead', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        ...testUser,
        current_hp: 0,
      });

      const response = await request(app.getHttpServer())
        .get('/api/game/hunt')
        .set('Authorization', 'Bearer fake_jwt_token')
        .expect(400);

      expect(response.body.message).toContain('нужно воскреснуть');
    });
  });

  describe('POST /api/game/action (Hunt → Combat)', () => {
    it('should perform attack action', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/game/action')
        .set('Authorization', 'Bearer fake_jwt_token')
        .send({ action: 'attack' })
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('xpGained');
      expect(response.body).toHaveProperty('bloodGained');
      expect(response.body).toHaveProperty('playerHp');
      expect(response.body).toHaveProperty('enemyHp');
    });

    it('should reject invalid action', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/game/action')
        .set('Authorization', 'Bearer fake_jwt_token')
        .send({ action: 'invalid_action' })
        .expect(400);

      expect(response.body.message).toContain('Недопустимое действие');
    });

    it('should reject missing action', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/game/action')
        .set('Authorization', 'Bearer fake_jwt_token')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/game/state', () => {
    it('should return game state', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(testUser);

      const response = await request(app.getHttpServer())
        .get('/api/game/state')
        .set('Authorization', 'Bearer fake_jwt_token')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('level');
      expect(response.body.user).toHaveProperty('xp');
      expect(response.body.user).toHaveProperty('bloodBalance');
    });
  });

  describe('POST /api/game/respawn', () => {
    it('should respawn dead player', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        ...testUser,
        current_hp: 0,
      });

      (userRepository.save as jest.Mock).mockResolvedValue({
        ...testUser,
        current_hp: 50,
      });

      const response = await request(app.getHttpServer())
        .post('/api/game/respawn')
        .set('Authorization', 'Bearer fake_jwt_token')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('воскресли');
    });

    it('should reject respawn if player is alive', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({
        ...testUser,
        current_hp: 50,
      });

      const response = await request(app.getHttpServer())
        .post('/api/game/respawn')
        .set('Authorization', 'Bearer fake_jwt_token')
        .expect(400);

      expect(response.body.message).toContain('уже живы');
    });
  });
});
