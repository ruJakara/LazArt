import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardService } from './leaderboard.service';
import { User } from '../../database/entities/user.entity';
import { GameLog } from '../../database/entities/game-log.entity';
import { LeaderboardFilter } from '../dto/leaderboard.dto';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let userRepository: Repository<User>;
  let gameLogRepository: Repository<GameLog>;

  const mockUserRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  };

  const mockGameLogRepository = {
    createQueryBuilder: jest.fn(),
    getRawOne: jest.fn(),
  };

  const mockRedisClient = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(GameLog),
          useValue: mockGameLogRepository,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    gameLogRepository = module.get<Repository<GameLog>>(getRepositoryToken(GameLog));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries', async () => {
      const mockUsers = [
        {
          id: '123',
          username: 'top_player',
          first_name: null,
          xp: 10000,
          level: 10,
        },
      ];

      mockUserRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUsers),
      });

      mockGameLogRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      });

      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.getLeaderboard(10, 0, LeaderboardFilter.XP);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(123);
      expect(result[0].username).toBe('top_player');
      expect(result[0].totalXp).toBe(10000);
    });
  });

  describe('getMyPosition', () => {
    it('should return player position', async () => {
      const mockUser = {
        id: '123',
        xp: 5000,
        level: 5,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(10),
      });
      mockUserRepository.count.mockResolvedValue(100);
      mockGameLogRepository.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '50' }),
      });

      const result = await service.getMyPosition(123);

      expect(result.rank).toBeGreaterThan(0);
      expect(result.totalXp).toBe(5000);
      expect(result.level).toBe(5);
    });

    it('should return zeros for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.getMyPosition(999);

      expect(result.rank).toBe(0);
      expect(result.totalXp).toBe(0);
    });
  });

  describe('invalidateCache', () => {
    it('should clear leaderboard cache', async () => {
      await service.invalidateCache();
      expect(mockRedisClient.del).toHaveBeenCalledWith('leaderboard:global');
    });
  });
});
