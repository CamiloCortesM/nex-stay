import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../reservations/pricing.service';
import { AvailableRoomsArgs } from './dto/args/available-rooms.args';
import { AvailableRoomResult } from './model/available-room-result.model';
import { PaginationArgs } from '../common/dto/args/pagination.args';
import { PagedAvailableRoomResult } from './model/paged-available-room-result.model';
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

  async findAvailableRooms(
    args: AvailableRoomsArgs,
  ): Promise<AvailableRoomResult[]> {
    const {
      checkIn,
      checkOut,
      people,
      roomType,
      exteriorViewOnly,
      allInclusive = false,
    } = args;

    // Find rooms that are available for the given date range
    const availableRooms = await this.prisma.room.findMany({
      where: {
        isDeleted: false,
        maxCapacity: { gte: people },
        ...(roomType && { type: roomType }),
        ...(exteriorViewOnly && { view: 'EXTERIOR' }),
        // Filter out rooms with overlapping reservations
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
                  status: { not: ReservationStatus.CANCELLED },
                },
              ],
            },
          },
        },
      },
    });

    // Calculate pricing details for each available room
    return availableRooms.map((room) => {
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
  }

  async findAvailableRoomsPaginated(
    args: AvailableRoomsArgs,
    paginationArgs: PaginationArgs,
  ): Promise<PagedAvailableRoomResult> {
    const { offset = 0, limit = 10 } = paginationArgs;
    const {
      checkIn,
      checkOut,
      people,
      roomType,
      exteriorViewOnly,
      allInclusive = false,
    } = args;

    // Create where clause for both count and data queries
    const whereClause: Prisma.RoomWhereInput = {
      isDeleted: false,
      maxCapacity: { gte: people },
      ...(roomType && { type: roomType }),
      ...(exteriorViewOnly && { view: 'EXTERIOR' }),
      // Filter out rooms with overlapping reservations
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
