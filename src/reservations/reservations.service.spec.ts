import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationsService } from './reservations.service';
import { PricingService } from './pricing.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateReservationInput } from './dto/inputs/create-reservation.input';
import { Reservation } from './models/reservation.model';
import { PaginationArgs } from '../common/dto/args/pagination.args';

// Mocks for external dependencies
const mockPrisma = {
  reservation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  room: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockPricingService = {
  calculateTotalPrice: jest.fn(),
  calculateNightOrDaysCount: jest.fn(),
  countWeekendNights: jest.fn(),
  calculateDiscount: jest.fn(),
  calculateAllInclusiveCost: jest.fn(),
};

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: typeof mockPrisma;
  let pricingService: typeof mockPricingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PricingService, useValue: mockPricingService },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    prisma = module.get<PrismaService>(
      PrismaService,
    ) as unknown as typeof mockPrisma;
    pricingService = module.get<PricingService>(
      PricingService,
    ) as unknown as typeof mockPricingService;

    jest.clearAllMocks();
  });

  describe('createReservation', () => {
    const mockUserId = 'user-123';
    const mockInput: CreateReservationInput = {
      roomType: 'DOBLE',
      checkIn: new Date('2023-01-01'),
      checkOut: new Date('2023-01-05'),
      people: 2,
      allInclusive: true,
    };

    const mockRoom = {
      id: 1,
      basePrice: 100000,
      maxCapacity: 4,
      type: 'DOBLE',
    };

    const mockReservation = {
      id: 'uuid-123',
      ...mockInput,
      userId: mockUserId,
      roomId: mockRoom.id,
      totalPrice: 450000,
      status: 'ACTIVE',
      room: mockRoom,
    };

    it('should create reservation successfully', async () => {
      prisma.room.findFirst.mockResolvedValue(mockRoom);
      prisma.reservation.create.mockResolvedValue(mockReservation);
      pricingService.calculateTotalPrice.mockReturnValue({
        totalPrice: 450000,
      });

      const result = await service.createReservation(mockUserId, mockInput);

      expect(prisma.room.findFirst).toHaveBeenCalledWith({
        where: {
          type: mockInput.roomType,
          id: { notIn: expect.any(Array) as number[] },
          maxCapacity: { gte: mockInput.people },
        },
      });

      expect(pricingService.calculateTotalPrice).toHaveBeenCalledWith({
        checkIn: mockInput.checkIn,
        checkOut: mockInput.checkOut,
        people: mockInput.people,
        basePrice: mockRoom.basePrice,
        allInclusive: mockInput.allInclusive,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { roomType, ...rest } = mockInput;

      expect(prisma.reservation.create).toHaveBeenCalledWith({
        data: {
          ...rest,
          roomId: mockRoom.id,
          userId: mockUserId,
          totalPrice: 450000,
        },
        include: { room: true },
      });

      expect(result).toEqual(mockReservation);
    });

    it('should throw ConflictException if no rooms are available', async () => {
      prisma.room.findFirst.mockResolvedValue(null);

      await expect(
        service.createReservation(mockUserId, mockInput),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancelReservation', () => {
    const mockReservation = {
      id: 'res-123',
      status: 'CANCELLED',
      room: { id: 1 },
    };

    it('should cancel reservation successfully', async () => {
      prisma.reservation.update.mockResolvedValue(mockReservation);

      const result = await service.cancelReservation('res-123');

      expect(prisma.reservation.update).toHaveBeenCalledWith({
        where: { id: 'res-123' },
        data: { status: 'CANCELLED' },
        include: { room: true },
      });
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw NotFoundException if reservation does not exist', async () => {
      prisma.reservation.update.mockRejectedValue(
        new Error('Reservation not found'),
      );

      await expect(service.cancelReservation('invalid-id')).rejects.toThrow(
        Error,
      );
    });
  });

  describe('findOne', () => {
    const mockReservation = {
      id: 'res-123',
      status: 'ACTIVE',
      room: { id: 'room-123' },
    };

    it('should return existing reservation', async () => {
      prisma.reservation.findUnique.mockResolvedValue(mockReservation);

      const result = await service.findOne('res-123');

      expect(prisma.reservation.findUnique).toHaveBeenCalledWith({
        where: { id: 'res-123' },
        include: { room: true },
      });
      expect(result).toEqual(mockReservation);
    });

    it('should throw NotFoundException if reservation does not exist', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findPaginatedReservations', () => {
    const mockPagination: PaginationArgs = { limit: 10, offset: 0 };
    const mockToday = new Date();

    const mockCounts = [5, 3, 10]; // [past, current, future]
    const mockResults = [
      [{ id: 'past-1' }, { id: 'past-2' }],
      [{ id: 'current-1' }],
      [{ id: 'future-1' }, { id: 'future-2' }],
    ];

    beforeEach(() => {
      jest.spyOn(global, 'Date').mockImplementation(() => mockToday);

      type TransactionCallback<T> = (prisma: typeof mockPrisma) => Promise<T>;

      prisma.$transaction.mockImplementation(
        <T>(
          queries: Promise<any>[] | TransactionCallback<T>,
        ): Promise<any[] | T> => {
          if (Array.isArray(queries)) {
            return Promise.all(queries);
          }
          return queries(prisma);
        },
      );

      prisma.reservation.count
        .mockResolvedValueOnce(mockCounts[0])
        .mockResolvedValueOnce(mockCounts[1])
        .mockResolvedValueOnce(mockCounts[2]);

      prisma.reservation.findMany
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2]);
    });

    it('should return paginated reservations', async () => {
      const result = await service.findPaginatedReservations(mockPagination);

      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        past: mockResults[0],
        current: mockResults[1],
        future: mockResults[2],
        totalPast: mockCounts[0],
        totalCurrent: mockCounts[1],
        totalFuture: mockCounts[2],
      });

      // Verify queries for current reservations
      expect(prisma.reservation.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            { checkIn: { lte: mockToday } },
            { checkOut: { gte: mockToday } },
          ],
        },
        skip: 0,
        take: 10,
        include: { room: true },
        orderBy: { checkIn: 'asc' },
      });
    });
  });

  describe('Price calculations', () => {
    const mockReservation = {
      checkIn: new Date('2023-01-01'),
      checkOut: new Date('2023-01-05'),
      people: 2,
      allInclusive: true,
      room: { basePrice: 100000 },
    } as Reservation;

    it('should calculate days correctly', () => {
      pricingService.calculateNightOrDaysCount.mockReturnValue(4);
      expect(service.calculateDaysCount(new Date(), new Date())).toBe(4);
    });

    it('should calculate weekend increment', () => {
      pricingService.countWeekendNights.mockReturnValue(2);
      const expected = 100000 * 0.2 * 2;
      expect(service.calculateWeekendIncrement(mockReservation)).toBe(expected);
    });

    it('should calculate days discount', () => {
      pricingService.calculateDiscount.mockReturnValue(10000);
      pricingService.calculateNightOrDaysCount.mockReturnValue(5);
      expect(service.calculateDaysDiscount(new Date(), new Date())).toBe(50000);
    });

    it('should calculate all-inclusive cost', () => {
      pricingService.calculateAllInclusiveCost.mockReturnValue(250000);
      expect(
        service.calculateAllInclusiveTotal(new Date(), new Date(), 2, true),
      ).toBe(250000);
    });
  });
});
