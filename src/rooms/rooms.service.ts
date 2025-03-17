import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../reservations/pricing.service';
import { AvailableRoomsArgs } from './dto/args/available-rooms.args';
import { PaginationArgs } from '../common/dto/args/pagination.args';
import { PagedAvailableRoomResult } from './types/paged-available-room-result.type';
import { Prisma, ReservationStatus } from '@prisma/client';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  async findAllRoomTypes(): Promise<string[]> {
    const rooms = await this.prisma.room.findMany({
      where: { isDeleted: false },
      select: { type: true },
      distinct: ['type'],
    });
    return rooms.map((room) => room.type);
  }

  async findAvailableRoomsPaginated(
    args: AvailableRoomsArgs,
    paginationArgs: PaginationArgs,
  ): Promise<PagedAvailableRoomResult> {
    if (args.checkIn >= args.checkOut) {
      throw new ConflictException('Check-out date must be after check-in date');
    }

    const { offset = 0, limit = 10 } = paginationArgs;
    const {
      checkIn,
      checkOut,
      people,
      roomType,
      exteriorViewOnly,
      allInclusive = false,
    } = args;

    /**
     * Constructs a Prisma where clause to filter available rooms based on search criteria.
     * This query handles several key filtering aspects:
     * 1. Basic room properties (capacity, type, view)
     * 2. Reservation overlap detection to exclude booked rooms
     * 3. Exclusion of deleted rooms
     */
    const whereClause: Prisma.RoomWhereInput = {
      isDeleted: false,
      maxCapacity: { gte: people },
      ...(roomType && { type: roomType }),
      ...(exteriorViewOnly && { view: 'EXTERIOR' }),

      /**
       * Complex reservation availability check:
       * Excludes rooms that have any non-cancelled reservations that overlap
       * with the requested date range. A reservation overlaps if:
       * - Its check-in date is before the requested check-out date AND
       * - Its check-out date is after the requested check-in date
       * This implements the standard hotel reservation non-overlap rule.
       */
      NOT: {
        reservations: {
          some: {
            AND: [
              {
                OR: [
                  {
                    checkIn: { lt: checkOut },
                    checkOut: { gt: checkIn },
                  },
                ],
              },
              {
                // Only consider active reservations (not cancelled ones)
                status: { not: ReservationStatus.CANCELLED },
              },
            ],
          },
        },
      },
    };

    // Get total count for pagination metadata
    const totalCount = await this.prisma.room.count({
      where: whereClause,
    });

    // Find available rooms with pagination
    const availableRooms = await this.prisma.room.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: { id: 'asc' }, // Add default sorting
    });

    // Calculate pricing details for each available room
    const items = availableRooms.map((room) => {
      const {
        totalNights,
        totalPrice,
        allInclusiveCost = 0,
        basePrice = 0,
        weekendSurcharge = 0,
        discount = 0,
      } = this.pricingService.calculateTotalPrice({
        checkIn,
        checkOut,
        people,
        basePrice: room.basePrice,
        allInclusive,
      });

      return {
        room,
        daysCount: totalNights,
        nightsCount: totalNights,
        baseValue: basePrice,
        weekendIncrement: weekendSurcharge,
        daysDiscount: discount,
        allInclusiveTotal: allInclusiveCost,
        totalPrice,
      };
    });

    // Return paginated result
    return {
      items,
      total: totalCount,
      offset,
      limit,
      hasMore: offset + items.length < totalCount,
    };
  }
}
