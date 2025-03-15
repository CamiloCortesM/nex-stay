import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RoomType } from '@prisma/client';

import { CreateReservationInput } from './dto/inputs/create-reservation.input';
import { PaginatedReservations } from './types/paginated-reservations.type';
import { PaginationArgs } from '../common/dto/args/pagination.args';
import { Reservation } from './models/reservation.model';
import { ReservationsResolver } from './reservations.resolver';
import { ReservationsService } from './reservations.service';
import { User } from '../auth/interfaces/user.interface';

// Mock the auth guard
jest.mock('../auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

// Mock external dependencies to avoid path resolution issues
jest.mock('../auth/decorators/get-user.decorator', () => ({
  GetUser: () => (target: any, key: string, descriptor: PropertyDescriptor) =>
    descriptor,
}));

jest.mock('../rooms/models/room.model', () => ({
  Room: class MockRoom {
    id: number;
    type: string;
    view: string;
    basePrice: number;
  },
}));

describe('ReservationsResolver', () => {
  let resolver: ReservationsResolver;
  let service: ReservationsService;

  // Create a mock for the service
  const mockReservationsService = {
    findOne: jest.fn(),
    findPaginatedReservations: jest.fn(),
    createReservation: jest.fn(),
    cancelReservation: jest.fn(),
    calculateDaysCount: jest.fn(),
    calculateNightsCount: jest.fn(),
    calculateWeekendIncrement: jest.fn(),
    calculateDaysDiscount: jest.fn(),
    calculateAllInclusiveTotal: jest.fn(),
  };

  // Centralized test data for reuse
  const testData = {
    userId: 'user-123',
    reservationId: 'reservation-123',
    createReservationInput: {
      checkIn: new Date('2023-06-01'),
      checkOut: new Date('2023-06-05'),
      people: 2,
      roomType: RoomType.SENCILLA,
      allInclusive: false,
    } as CreateReservationInput,
    mockReservation: {
      id: 'reservation-123',
      checkIn: new Date('2023-06-01'),
      checkOut: new Date('2023-06-05'),
      people: 2,
      roomId: 1,
      userId: 'user-123',
      totalPrice: 400,
      status: 'ACTIVE',
      allInclusive: false,
      createdAt: new Date('2023-05-15'),
      room: {
        id: 1,
        type: 'SENCILLA',
        view: 'EXTERIOR',
        basePrice: 100,
      },
    } as Reservation,
    paginationArgs: {
      offset: 0,
      limit: 10,
    } as PaginationArgs,
    mockUser: {
      idUser: 'user-123',
    } as User,
    paginatedResult: {
      past: [],
      current: [],
      future: [],
      totalPast: 0,
      totalCurrent: 0,
      totalFuture: 0,
    } as PaginatedReservations,
  };

  beforeEach(async () => {
    // Reset all mocked functions
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsResolver,
        {
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
      ],
    }).compile();

    resolver = module.get<ReservationsResolver>(ReservationsResolver);
    service = module.get<ReservationsService>(ReservationsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('getReservation', () => {
    it('should return a reservation by ID', async () => {
      // Arrange
      mockReservationsService.findOne.mockResolvedValue(
        testData.mockReservation,
      );

      // Act
      const result = await resolver.getReservation(testData.reservationId);

      // Assert
      expect(result).toEqual(testData.mockReservation);
      expect(mockReservationsService.findOne).toHaveBeenCalledWith(
        testData.reservationId,
      );
    });

    it('should throw NotFoundException when reservation not found', async () => {
      // Arrange
      mockReservationsService.findOne.mockRejectedValue(
        new NotFoundException(
          `Reservation with ID ${testData.reservationId} not found`,
        ),
      );

      // Act & Assert
      await expect(
        resolver.getReservation(testData.reservationId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPaginatedReservations', () => {
    it('should return paginated reservations', async () => {
      // Arrange
      mockReservationsService.findPaginatedReservations.mockResolvedValue(
        testData.paginatedResult,
      );

      // Act
      const result = await resolver.getPaginatedReservations(
        testData.paginationArgs,
      );

      // Assert
      expect(result).toEqual(testData.paginatedResult);
      expect(
        mockReservationsService.findPaginatedReservations,
      ).toHaveBeenCalledWith(testData.paginationArgs);
    });
  });

  describe('createReservation', () => {
    it('should create a new reservation', async () => {
      // Arrange
      mockReservationsService.createReservation.mockResolvedValue(
        testData.mockReservation,
      );

      // Act
      const result = await resolver.createReservation(
        testData.mockUser,
        testData.createReservationInput,
      );

      // Assert
      expect(result).toEqual(testData.mockReservation);
      expect(mockReservationsService.createReservation).toHaveBeenCalledWith(
        testData.userId,
        testData.createReservationInput,
      );
    });

    it('should throw ConflictException when no rooms available', async () => {
      // Arrange
      mockReservationsService.createReservation.mockRejectedValue(
        new ConflictException(
          'No rooms available for the selected dates and people count',
        ),
      );

      // Act & Assert
      await expect(
        resolver.createReservation(
          testData.mockUser,
          testData.createReservationInput,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a reservation', async () => {
      // Arrange
      const cancelledReservation = {
        ...testData.mockReservation,
        status: 'CANCELLED',
      };
      mockReservationsService.cancelReservation.mockResolvedValue(
        cancelledReservation,
      );

      // Act
      const result = await resolver.cancelReservation(testData.reservationId);

      // Assert
      expect(result).toEqual(cancelledReservation);
      expect(mockReservationsService.cancelReservation).toHaveBeenCalledWith(
        testData.reservationId,
      );
      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('ResolveField methods', () => {
    it('should calculate daysCount correctly', () => {
      // Arrange
      const expectedDays = 5;
      mockReservationsService.calculateDaysCount.mockReturnValue(expectedDays);

      // Act
      const result = resolver.daysCount(testData.mockReservation);

      // Assert
      expect(result).toBe(expectedDays);
      expect(mockReservationsService.calculateDaysCount).toHaveBeenCalledWith(
        testData.mockReservation.checkIn,
        testData.mockReservation.checkOut,
      );
    });

    it('should calculate nightsCount correctly', () => {
      // Arrange
      const expectedNights = 4;
      mockReservationsService.calculateNightsCount.mockReturnValue(
        expectedNights,
      );

      // Act
      const result = resolver.nightsCount(testData.mockReservation);

      // Assert
      expect(result).toBe(expectedNights);
      expect(mockReservationsService.calculateNightsCount).toHaveBeenCalledWith(
        testData.mockReservation.checkIn,
        testData.mockReservation.checkOut,
      );
    });

    it('should return baseValue from room', () => {
      // Act
      const result = resolver.baseValue(testData.mockReservation);

      // Assert
      expect(result).toBe(testData.mockReservation.room.basePrice);
    });

    it('should calculate weekendIncrement correctly', () => {
      // Arrange
      const expectedIncrement = 40;
      mockReservationsService.calculateWeekendIncrement.mockReturnValue(
        expectedIncrement,
      );

      // Act
      const result = resolver.weekendIncrement(testData.mockReservation);

      // Assert
      expect(result).toBe(expectedIncrement);
      expect(
        mockReservationsService.calculateWeekendIncrement,
      ).toHaveBeenCalledWith(testData.mockReservation);
    });

    it('should calculate daysDiscount correctly', () => {
      // Arrange
      const expectedDiscount = 40000;
      mockReservationsService.calculateDaysDiscount.mockReturnValue(
        expectedDiscount,
      );

      // Act
      const result = resolver.daysDiscount(testData.mockReservation);

      // Assert
      expect(result).toBe(expectedDiscount);
      expect(
        mockReservationsService.calculateDaysDiscount,
      ).toHaveBeenCalledWith(
        testData.mockReservation.checkIn,
        testData.mockReservation.checkOut,
      );
    });

    it('should calculate allInclusiveTotal correctly', () => {
      // Arrange
      const expectedTotal = 0; // Since allInclusive is false in test data
      mockReservationsService.calculateAllInclusiveTotal.mockReturnValue(
        expectedTotal,
      );

      // Act
      const result = resolver.allInclusiveTotal(testData.mockReservation);

      // Assert
      expect(result).toBe(expectedTotal);
      expect(
        mockReservationsService.calculateAllInclusiveTotal,
      ).toHaveBeenCalledWith(
        testData.mockReservation.checkIn,
        testData.mockReservation.checkOut,
        testData.mockReservation.people,
        testData.mockReservation.allInclusive,
      );
    });

    it('should calculate allInclusiveTotal correctly when all-inclusive is true', () => {
      // Arrange
      const allInclusiveReservation = {
        ...testData.mockReservation,
        allInclusive: true,
      };
      const expectedTotal = 200000; // Some non-zero value
      mockReservationsService.calculateAllInclusiveTotal.mockReturnValue(
        expectedTotal,
      );

      // Act
      const result = resolver.allInclusiveTotal(allInclusiveReservation);

      // Assert
      expect(result).toBe(expectedTotal);
      expect(
        mockReservationsService.calculateAllInclusiveTotal,
      ).toHaveBeenCalledWith(
        allInclusiveReservation.checkIn,
        allInclusiveReservation.checkOut,
        allInclusiveReservation.people,
        true,
      );
    });
  });
});
