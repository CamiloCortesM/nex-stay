import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationInput } from './dto/inputs/create-reservation.input';
import { Reservation } from './models/reservation.model';
import { PaginationArgs } from '../common/dto/args/pagination.args';
import { PaginatedReservations } from './types/paginated-reservations.type';
import { PricingService } from './pricing.service';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private pricingService: PricingService,
  ) {}

  async createReservation(
    userId: string,
    input: CreateReservationInput,
  ): Promise<Reservation> {
    // 1. Validate room availability
    const availableRoom = await this.findAvailableRoom(input);

    if (!availableRoom) {
      throw new ConflictException(
        'No rooms available for the selected dates and people count',
      );
    }

    const { checkIn, checkOut, allInclusive, people } = input;

    // 2. Calculate pricing
    const { totalPrice } = this.pricingService.calculateTotalPrice({
      checkIn: checkIn,
      checkOut: checkOut,
      people: people,
      basePrice: availableRoom.basePrice,
      allInclusive: allInclusive,
    });

    // 3. Create reservation
    return this.prisma.reservation.create({
      data: {
        checkIn: checkIn,
        checkOut: checkOut,
        people: people,
        roomId: availableRoom.id,
        userId,
        totalPrice: totalPrice,
        allInclusive: allInclusive,
      },
      include: { room: true },
    });
  }

  /**
   * Finds an available room based on the reservation input criteria
   *
   * @param input - The CreateReservationInput containing room requirements
   * @returns A Promise resolving to an available room or null if none is found
   *
   * @description
   * This method checks for room availability by:
   * 1. Finding all conflicting reservations for the requested dates
   * 2. Searching for a room of the requested type that isn't booked
   * 3. Ensuring the room can accommodate the number of people
   */
  private async findAvailableRoom(input: CreateReservationInput) {
    const conflictingReservations = await this.prisma.reservation.findMany({
      where: {
        room: { type: input.roomType },
        status: 'ACTIVE',
        checkIn: { lt: input.checkOut },
        checkOut: { gt: input.checkIn },
      },
      select: { roomId: true },
    });

    return this.prisma.room.findFirst({
      where: {
        type: input.roomType,
        id: {
          notIn: conflictingReservations
            ? conflictingReservations.map((r) => r.roomId)
            : [],
        },
        maxCapacity: { gte: input.people },
      },
    });
  }

  /**
   * Cancels an existing reservation by changing its status
   *
   * @param id - The unique identifier of the reservation to cancel
   * @returns A Promise resolving to the updated reservation with CANCELLED status
   *
   * @throws {NotFoundException} If the reservation with the given ID doesn't exist
   */
  async cancelReservation(id: string) {
    return this.prisma.reservation.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { room: true },
    });
  }

  /**
   * Retrieves a single reservation by its ID
   *
   * @param id - The unique identifier of the reservation
   * @returns A Promise resolving to the reservation with the associated room
   *
   * @throws {NotFoundException} If no reservation with the given ID exists
   */
  async findOne(id: string): Promise<Reservation> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return reservation;
  }

  async findPaginatedReservations(
    paginationArgs: PaginationArgs,
  ): Promise<PaginatedReservations> {
    const { limit, offset } = paginationArgs;
    const today = new Date();

    const [totalPast, totalCurrent, totalFuture] =
      await this.prisma.$transaction([
        this.prisma.reservation.count({
          where: {
            checkOut: { lt: today },
          },
        }),
        this.prisma.reservation.count({
          where: {
            AND: [{ checkIn: { lte: today } }, { checkOut: { gte: today } }],
          },
        }),
        this.prisma.reservation.count({
          where: {
            checkIn: { gt: today },
          },
        }),
      ]);

    const [past, current, future] = await this.prisma.$transaction([
      this.prisma.reservation.findMany({
        where: {
          checkOut: { lt: today },
        },
        skip: offset,
        take: limit,
        include: { room: true },
        orderBy: { checkOut: 'desc' },
      }),
      this.prisma.reservation.findMany({
        where: {
          AND: [{ checkIn: { lte: today } }, { checkOut: { gte: today } }],
        },
        skip: offset,
        take: limit,
        include: { room: true },
        orderBy: { checkIn: 'asc' },
      }),
      this.prisma.reservation.findMany({
        where: {
          checkIn: { gt: today },
        },
        skip: offset,
        take: limit,
        include: { room: true },
        orderBy: { checkIn: 'asc' },
      }),
    ]);

    return {
      past,
      current,
      future,
      totalPast,
      totalCurrent,
      totalFuture,
    };
  }

  calculateDaysCount(checkIn: Date, checkOut: Date): number {
    return this.pricingService.calculateNightOrDaysCount(checkIn, checkOut);
  }

  calculateNightsCount(checkIn: Date, checkOut: Date): number {
    return this.pricingService.calculateNightOrDaysCount(checkIn, checkOut);
  }

  calculateWeekendIncrement(reservation: Reservation): number {
    const { checkIn, checkOut, room } = reservation;
    const basePrice = room.basePrice;

    const nightsCount = this.calculateNightsCount(checkIn, checkOut);

    const weekendNights = this.pricingService.countWeekendNights(
      checkIn,
      nightsCount,
    );

    return basePrice * 0.2 * weekendNights;
  }

  calculateDaysDiscount(checkIn: Date, checkOut: Date): number {
    const nightsCount = this.calculateNightsCount(checkIn, checkOut);
    return this.pricingService.calculateDiscount(nightsCount) * nightsCount;
  }

  calculateAllInclusiveTotal(
    checkIn: Date,
    checkOut: Date,
    people: number,
    allInclusive: boolean,
  ): number {
    const nightsCount = this.calculateNightsCount(checkIn, checkOut);
    return this.pricingService.calculateAllInclusiveCost(
      allInclusive,
      people,
      nightsCount,
    );
  }
}
