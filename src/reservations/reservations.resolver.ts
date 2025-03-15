import {
  Resolver,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Query,
} from '@nestjs/graphql';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';

import { CreateReservationInput } from './dto/inputs/create-reservation.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/interfaces/user.interface';
import { Reservation } from './models/reservation.model';
import { PaginationArgs } from '../common/dto/args/pagination.args';
import { PaginatedReservations } from './types/paginated-reservations.type';
import { ReservationsService } from './reservations.service';

@Resolver(() => Reservation)
export class ReservationsResolver {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * Retrieves a specific reservation by ID
   * @param id - Unique reservation identifier
   */
  @Query(() => Reservation, { name: 'reservation' })
  @UseGuards(JwtAuthGuard)
  async getReservation(
    @Args('id', { type: () => String }, ParseUUIDPipe) id: string,
  ): Promise<Reservation> {
    return this.reservationsService.findOne(id);
  }

  /**
   * Lists reservations with pagination support
   * @param paginationArgs - Pagination parameters (limit, offset)
   */
  @Query(() => PaginatedReservations, { name: 'reservations' })
  @UseGuards(JwtAuthGuard)
  async getPaginatedReservations(
    @Args() paginationArgs: PaginationArgs,
  ): Promise<PaginatedReservations> {
    return this.reservationsService.findPaginatedReservations(paginationArgs);
  }

  /**
   * Creates a new reservation for the authenticated user
   * @param user - Current authenticated user
   * @param createReservationInput - Reservation details
   */
  @Mutation(() => Reservation)
  @UseGuards(JwtAuthGuard)
  async createReservation(
    @GetUser() user: User,
    @Args('createReservationInput')
    createReservationInput: CreateReservationInput,
  ): Promise<Reservation> {
    return this.reservationsService.createReservation(
      user.idUser,
      createReservationInput,
    );
  }

  /**
   * Cancels an existing reservation
   * @param id - Reservation to cancel
   */
  @Mutation(() => Reservation)
  @UseGuards(JwtAuthGuard)
  async cancelReservation(
    @Args('id', { type: () => String }, ParseUUIDPipe) id: string,
  ) {
    return this.reservationsService.cancelReservation(id);
  }

  /**
   * Calculates total days in stay (inclusive of check-in and check-out days)
   */
  @ResolveField(() => Number, {
    description: 'Number of days in the reservation',
    name: 'daysCount',
  })
  daysCount(@Parent() reservation: Reservation): number {
    return this.reservationsService.calculateDaysCount(
      reservation.checkIn,
      reservation.checkOut,
    );
  }

  /**
   * Calculates total nights in stay (excludes check-out day)
   */
  @ResolveField(() => Number, {
    description: 'Number of nights in the reservation',
    name: 'nightsCount',
  })
  nightsCount(@Parent() reservation: Reservation): number {
    return this.reservationsService.calculateNightsCount(
      reservation.checkIn,
      reservation.checkOut,
    );
  }

  /**
   * Returns the base room price from the associated room
   */
  @ResolveField(() => Number, {
    description: 'Base value applied to the reservation',
    name: 'baseValue',
  })
  baseValue(@Parent() reservation: Reservation): number {
    return reservation.room.basePrice;
  }

  /**
   * Calculates weekend pricing surcharge applied to the reservation
   */
  @ResolveField(() => Number, {
    description: 'Total weekend increment applied',
    name: 'weekendIncrement',
  })
  weekendIncrement(@Parent() reservation: Reservation): number {
    return this.reservationsService.calculateWeekendIncrement(reservation);
  }

  /**
   * Calculates long-stay discount based on reservation duration
   */
  @ResolveField(() => Number, {
    description: 'Total discount for days',
    name: 'daysDiscount',
  })
  daysDiscount(@Parent() reservation: Reservation): number {
    return this.reservationsService.calculateDaysDiscount(
      reservation.checkIn,
      reservation.checkOut,
    );
  }

  /**
   * Calculates all-inclusive package cost based on guests and duration
   */
  @ResolveField(() => Number, {
    description: 'Total for all inclusive',
    name: 'allInclusiveTotal',
  })
  allInclusiveTotal(@Parent() reservation: Reservation): number {
    return this.reservationsService.calculateAllInclusiveTotal(
      reservation.checkIn,
      reservation.checkOut,
      reservation.people,
      reservation.allInclusive,
    );
  }
}
