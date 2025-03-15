import { Test, TestingModule } from '@nestjs/testing';
import { RoomType } from '@prisma/client';
import { RoomsResolver } from './rooms.resolver';
import { RoomsService } from './rooms.service';
import { AvailableRoomsArgs } from './dto/args/available-rooms.args';
import { PagedAvailableRoomResult } from './types/paged-available-room-result.type';

jest.mock('../reservations/models/reservation.model', () => ({
  Reservation: {
    name: 'Reservation',
    description: 'Mocked Reservation Model',
  },
}));

jest.mock('./models/room.model', () => ({
  Room: {
    name: 'Room',
    description: 'Mocked Room Model',
  },
}));

const mockRoomsService = {
  findAllRoomTypes: jest.fn(),
  findAvailableRoomsPaginated: jest.fn(),
};

jest.mock('../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe('RoomsResolver', () => {
  let resolver: RoomsResolver;
  let service: RoomsService;

  const testData = {
    roomTypes: {
      standard: ['SENCILLA', 'DOBLE', 'PRESIDENCIAL'],
      empty: [],
    },
    dates: {
      shortStay: {
        checkIn: new Date('2023-07-01'),
        checkOut: new Date('2023-07-05'),
      },
      longStay: {
        checkIn: new Date('2023-08-01'),
        checkOut: new Date('2023-08-10'),
      },
    },
    pagination: {
      first: { offset: 0, limit: 10 },
      middle: { offset: 20, limit: 5 },
      max: { offset: 0, limit: 100 },
    },
    createAvailableRoomsArgs: (
      options?: Partial<AvailableRoomsArgs>,
    ): AvailableRoomsArgs => ({
      checkIn: testData.dates.shortStay.checkIn,
      checkOut: testData.dates.shortStay.checkOut,
      people: 2,
      roomType: RoomType.SENCILLA,
      exteriorViewOnly: false,
      allInclusive: false,
      ...options,
    }),
    createPagedResult: (
      options?: Partial<PagedAvailableRoomResult>,
    ): PagedAvailableRoomResult => ({
      items: [],
      total: 0,
      offset: 0,
      limit: 10,
      hasMore: false,
      ...options,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsResolver,
        { provide: RoomsService, useValue: mockRoomsService },
      ],
    }).compile();

    resolver = module.get<RoomsResolver>(RoomsResolver);
    service = module.get<RoomsService>(RoomsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getRoomTypes', () => {
    it('should return an array of room types', async () => {
      mockRoomsService.findAllRoomTypes.mockResolvedValue(
        testData.roomTypes.standard,
      );

      const result = await resolver.getRoomTypes();

      expect(result).toEqual(testData.roomTypes.standard);
      expect(mockRoomsService.findAllRoomTypes).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no room types found', async () => {
      mockRoomsService.findAllRoomTypes.mockResolvedValue(
        testData.roomTypes.empty,
      );

      const result = await resolver.getRoomTypes();

      expect(result).toEqual([]);
      expect(mockRoomsService.findAllRoomTypes).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database failure');
      mockRoomsService.findAllRoomTypes.mockRejectedValue(error);

      await expect(resolver.getRoomTypes()).rejects.toThrow(error);
    });
  });

  describe('getAvailableRooms', () => {
    it('should return paginated results with valid parameters', async () => {
      const args = testData.createAvailableRoomsArgs();
      const pagination = testData.pagination.first;
      const mockResult = testData.createPagedResult();

      mockRoomsService.findAvailableRoomsPaginated.mockResolvedValue(
        mockResult,
      );

      const result = await resolver.getAvailableRooms(args, pagination);

      expect(result).toEqual(mockResult);
      expect(mockRoomsService.findAvailableRoomsPaginated).toHaveBeenCalledWith(
        args,
        pagination,
      );
    });

    it('should handle different pagination parameters', async () => {
      const args = testData.createAvailableRoomsArgs();
      const pagination = testData.pagination.middle;
      const mockResult = testData.createPagedResult({
        offset: 20,
        limit: 5,
        total: 25,
      });

      mockRoomsService.findAvailableRoomsPaginated.mockResolvedValue(
        mockResult,
      );

      const result = await resolver.getAvailableRooms(args, pagination);

      expect(result.hasMore).toBe(false);
      expect(result.total).toBe(25);
    });

    it('should handle invalid date parameters', async () => {
      const args = testData.createAvailableRoomsArgs({
        checkIn: new Date('2023-07-10'),
        checkOut: new Date('2023-07-05'),
      });

      const error = new Error('Invalid date range');
      mockRoomsService.findAvailableRoomsPaginated.mockRejectedValue(error);

      await expect(
        resolver.getAvailableRooms(args, testData.pagination.first),
      ).rejects.toThrow(error);
    });

    it('should handle service errors', async () => {
      const args = testData.createAvailableRoomsArgs();
      const error = new Error('Service unavailable');
      mockRoomsService.findAvailableRoomsPaginated.mockRejectedValue(error);

      await expect(
        resolver.getAvailableRooms(args, testData.pagination.first),
      ).rejects.toThrow(error);
    });
  });
});
