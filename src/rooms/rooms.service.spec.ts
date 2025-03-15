/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../reservations/pricing.service';
import { ReservationStatus, RoomType } from '@prisma/client';
import { AvailableRoomsArgs } from './dto/args/available-rooms.args';
import { PaginationArgs } from '../common/dto/args/pagination.args';

// Mock dependencies
const mockPrismaService = {
  room: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

const mockPricingService = {
  calculateTotalPrice: jest.fn(),
};

describe('RoomsService', () => {
  let service: RoomsService;
  let prismaService: PrismaService;
  let pricingService: PricingService;

  // Test data centralized for reuse and easier maintenance
  const testData = {
    roomTypes: ['SENCILLA', 'DOBLE', 'PRESIDENCIAL'],
    dates: {
      checkIn: new Date('2023-07-01'),
      checkOut: new Date('2023-07-05'),
    },
    rooms: [
      {
        id: 1,
        type: 'SENCILLA',
        view: 'EXTERIOR',
        basePrice: 100,
        maxCapacity: 2,
        isDeleted: false,
        createdAt: new Date('2023-01-01'),
      },
      {
        id: 2,
        type: 'DOBLE',
        view: 'INTERIOR',
        basePrice: 200,
        maxCapacity: 4,
        isDeleted: false,
        createdAt: new Date('2023-01-02'),
      },
    ],
    pricingDetails: {
      totalNights: 4,
      totalPrice: 550,
      allInclusiveCost: 80,
      basePrice: 400,
      weekendSurcharge: 100,
      discount: 30,
    },
    createAvailableRoomsArgs: (
      options?: Partial<AvailableRoomsArgs>,
    ): AvailableRoomsArgs => ({
      checkIn: testData.dates.checkIn,
      checkOut: testData.dates.checkOut,
      people: 2,
      roomType: RoomType.SENCILLA,
      exteriorViewOnly: false,
      allInclusive: false,
      ...options,
    }),
    createPaginationArgs: (
      options?: Partial<PaginationArgs>,
    ): PaginationArgs => ({
      offset: 0,
      limit: 10,
      ...options,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PricingService, useValue: mockPricingService },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
    prismaService = module.get<PrismaService>(PrismaService);
    pricingService = module.get<PricingService>(PricingService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllRoomTypes', () => {
    it('should return an array of room types', async () => {
      // Arrange
      const mockRooms = [
        { type: 'SENCILLA' },
        { type: 'DOBLE' },
        { type: 'PRESIDENCIAL' },
      ];
      mockPrismaService.room.findMany.mockResolvedValue(mockRooms);

      // Act
      const result = await service.findAllRoomTypes();

      // Assert
      expect(result).toEqual(testData.roomTypes);
      expect(mockPrismaService.room.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
        select: { type: true },
        distinct: ['type'],
      });
    });

    it('should return an empty array when no room types found', async () => {
      // Arrange
      mockPrismaService.room.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findAllRoomTypes();

      // Assert
      expect(result).toEqual([]);
      expect(mockPrismaService.room.findMany).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Arrange
      mockPrismaService.room.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      // Act & Assert
      await expect(service.findAllRoomTypes()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('findAvailableRoomsPaginated', () => {
    it('should return paginated available rooms with pricing details', async () => {
      // Arrange
      const args = testData.createAvailableRoomsArgs();
      const paginationArgs = testData.createPaginationArgs();

      mockPrismaService.room.count.mockResolvedValue(2);
      mockPrismaService.room.findMany.mockResolvedValue(testData.rooms);
      mockPricingService.calculateTotalPrice.mockReturnValue(
        testData.pricingDetails,
      );

      // Act
      const result = await service.findAvailableRoomsPaginated(
        args,
        paginationArgs,
      );

      // Assert
      expect(result).toEqual({
        items: testData.rooms.map((room) => ({
          room,
          daysCount: testData.pricingDetails.totalNights,
          nightsCount: testData.pricingDetails.totalNights,
          baseValue: testData.pricingDetails.basePrice,
          weekendIncrement: testData.pricingDetails.weekendSurcharge,
          daysDiscount: testData.pricingDetails.discount,
          allInclusiveTotal: testData.pricingDetails.allInclusiveCost,
          totalPrice: testData.pricingDetails.totalPrice,
        })),
        total: 2,
        offset: 0,
        limit: 10,
        hasMore: false,
      });

      // Define proper types for the Prisma query parameters
      type RoomQueryParams = {
        where: {
          isDeleted: boolean;
          maxCapacity: { gte: number };
          type?: RoomType;
          view?: string;
          NOT: {
            reservations: {
              some: {
                AND: [
                  {
                    OR: [
                      {
                        checkIn: { lt: Date };
                        checkOut: { gt: Date };
                      },
                      {
                        checkIn: { gte: Date };
                        checkOut: { lte: Date };
                      },
                    ];
                  },
                  {
                    status: { not: ReservationStatus };
                  },
                ];
              };
            };
          };
        };
        skip: number;
        take: number;
        orderBy: { id: 'asc' | 'desc' };
      };

      // Verify the correct where clause with proper typing
      expect(mockPrismaService.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isDeleted: false,
            maxCapacity: { gte: 2 },
            type: RoomType.SENCILLA,
          }) as unknown as RoomQueryParams['where'],
          skip: 0,
          take: 10,
          orderBy: { id: 'asc' },
        }) as RoomQueryParams,
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const whereClause = mockPrismaService.room.findMany.mock.calls[0][0]
        .where as RoomQueryParams['where'];

      const reservationCheck = whereClause.NOT.reservations.some.AND[0] as {
        OR: Array<{
          checkIn: { lt: Date } | { gte: Date };
          checkOut: { gt: Date } | { lte: Date };
        }>;
      };

      expect(reservationCheck.OR[0]).toEqual({
        checkIn: { lt: args.checkOut },
        checkOut: { gt: args.checkIn },
      });

      const statusCheck = whereClause.NOT.reservations.some.AND[1] as {
        status: { not: ReservationStatus };
      };

      expect(statusCheck).toEqual({
        status: { not: ReservationStatus.CANCELLED },
      });
    });

    it('should apply exterior view filter when requested', async () => {
      // Arrange
      const args = testData.createAvailableRoomsArgs({
        exteriorViewOnly: true,
      });
      const paginationArgs = testData.createPaginationArgs();

      mockPrismaService.room.count.mockResolvedValue(1);
      mockPrismaService.room.findMany.mockResolvedValue([testData.rooms[0]]);
      mockPricingService.calculateTotalPrice.mockReturnValue(
        testData.pricingDetails,
      );

      // Act
      await service.findAvailableRoomsPaginated(args, paginationArgs);

      // Assert
      expect(mockPrismaService.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining<{ where: unknown }>({
          where: expect.objectContaining<{ view: string }>({
            view: 'EXTERIOR',
          }),
        }),
      );
    });

    it('should handle pagination correctly with hasMore flag', async () => {
      // Arrange
      const args = testData.createAvailableRoomsArgs({ roomType: undefined });
      const paginationArgs = testData.createPaginationArgs({
        offset: 5,
        limit: 5,
      });

      mockPrismaService.room.count.mockResolvedValue(20);
      mockPrismaService.room.findMany.mockResolvedValue([testData.rooms[0]]);
      mockPricingService.calculateTotalPrice.mockReturnValue(
        testData.pricingDetails,
      );

      // Act
      const result = await service.findAvailableRoomsPaginated(
        args,
        paginationArgs,
      );

      // Assert
      expect(result.offset).toEqual(5);
      expect(result.limit).toEqual(5);
      expect(result.hasMore).toBe(true); // 5 + 1 < 20

      expect(mockPrismaService.room.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });

    it('should handle empty results when no rooms match criteria', async () => {
      // Arrange
      const args = testData.createAvailableRoomsArgs({ people: 10 }); // High capacity requirement
      const paginationArgs = testData.createPaginationArgs();

      mockPrismaService.room.count.mockResolvedValue(0);
      mockPrismaService.room.findMany.mockResolvedValue([]);

      // Act
      const result = await service.findAvailableRoomsPaginated(
        args,
        paginationArgs,
      );

      // Assert
      expect(result.items).toEqual([]);
      expect(result.total).toEqual(0);
      expect(result.hasMore).toBe(false);
    });

    it('should calculate all-inclusive pricing correctly', async () => {
      // Arrange
      const args = testData.createAvailableRoomsArgs({ allInclusive: true });
      const paginationArgs = testData.createPaginationArgs();

      const allInclusivePricing = {
        ...testData.pricingDetails,
        allInclusiveCost: 120,
        totalPrice: 590, // Higher for all-inclusive
      };

      mockPrismaService.room.count.mockResolvedValue(1);
      mockPrismaService.room.findMany.mockResolvedValue([testData.rooms[0]]);
      mockPricingService.calculateTotalPrice.mockReturnValue(
        allInclusivePricing,
      );

      // Act
      const result = await service.findAvailableRoomsPaginated(
        args,
        paginationArgs,
      );

      // Assert
      expect(result.items[0].allInclusiveTotal).toEqual(120);
      expect(result.items[0].totalPrice).toEqual(590);
      expect(mockPricingService.calculateTotalPrice).toHaveBeenCalledWith(
        expect.objectContaining({
          allInclusive: true,
        }),
      );
    });

    it('should handle database errors during count', async () => {
      // Arrange
      const args = testData.createAvailableRoomsArgs();
      const paginationArgs = testData.createPaginationArgs();

      mockPrismaService.room.count.mockRejectedValue(
        new Error('Database connection error'),
      );

      // Act & Assert
      await expect(
        service.findAvailableRoomsPaginated(args, paginationArgs),
      ).rejects.toThrow('Database connection error');
    });

    it('should handle database errors during findMany', async () => {
      // Arrange
      const args = testData.createAvailableRoomsArgs();
      const paginationArgs = testData.createPaginationArgs();

      mockPrismaService.room.count.mockResolvedValue(5);
      mockPrismaService.room.findMany.mockRejectedValue(
        new Error('Query execution error'),
      );

      // Act & Assert
      await expect(
        service.findAvailableRoomsPaginated(args, paginationArgs),
      ).rejects.toThrow('Query execution error');
    });
  });
});
