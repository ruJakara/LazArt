import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReferralService } from './referral.service';
import { User } from '../../database/entities/user.entity';
import { Referral } from '../../database/entities/referral.entity';

describe('ReferralService', () => {
  let service: ReferralService;
  let userRepository: Repository<User>;
  let referralRepository: Repository<Referral>;

  const mockUserRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockReferralRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Referral),
          useValue: mockReferralRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ReferralService>(ReferralService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    referralRepository = module.get<Repository<Referral>>(getRepositoryToken(Referral));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getReferralCode', () => {
    it('should return referral info for user', async () => {
      const mockUser = {
        id: '123',
        username: 'test_user',
        referral_code: 'REF123ABC',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockReferralRepository.count.mockResolvedValue(5);

      const result = await service.getReferralCode(123);

      expect(result.code).toBe('REF123ABC');
      expect(result.referredCount).toBe(5);
      expect(result.referralLink).toContain('REF123ABC');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.getReferralCode(999)).rejects.toThrow('User not found');
    });
  });

  describe('claimBonus', () => {
    it('should return success false when no pending bonuses', async () => {
      const mockUser = { id: '123' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockReferralRepository.find.mockResolvedValue([]);

      const result = await service.claimBonus(123);

      expect(result.success).toBe(false);
      expect(result.bonus).toBe(0);
    });

    it('should claim bonuses successfully', async () => {
      const mockUser = { id: '123' };
      const mockPendingReferrals = [
        { id: 1, referrer_id: '123', bonus_claimed: false },
        { id: 2, referrer_id: '123', bonus_claimed: false },
      ];

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockReferralRepository.find.mockResolvedValue(mockPendingReferrals);

      const mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          increment: jest.fn(),
          update: jest.fn(),
        },
      };

      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      const result = await service.claimBonus(123);

      expect(result.success).toBe(true);
      expect(result.bonus).toBe(200); // 2 реферала * 100 крови
    });
  });

  describe('processReferral', () => {
    it('should create referral record', async () => {
      const mockNewUser = { id: '456', referred_by: null };
      const mockReferrer = { id: '123', referral_code: 'REF123' };

      mockUserRepository.findOne
        .mockResolvedValueOnce(mockReferrer)
        .mockResolvedValueOnce(null);

      mockReferralRepository.findOne.mockResolvedValue(null);
      mockReferralRepository.create.mockReturnValue({
        referrer_id: '123',
        referred_id: '456',
      });
      mockReferralRepository.save.mockResolvedValue({});

      await service.processReferral(mockNewUser as User, 'REF123');

      expect(mockReferralRepository.save).toHaveBeenCalled();
    });

    it('should do nothing for invalid referral code', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await service.processReferral({ id: '456' } as User, 'INVALID');

      expect(mockReferralRepository.save).not.toHaveBeenCalled();
    });
  });
});
