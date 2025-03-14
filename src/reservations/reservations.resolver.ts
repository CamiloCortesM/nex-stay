import {
  Resolver,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Query,
} from '@nestjs/graphql';
import { ReservationsService } from './reservations.service';
import { CreateReservationInput } from './dto/inputs/create-reservation.input';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/interfaces/user.interface';
import { Reservation } from './model/reservation.model';
import { PaginationArgs } from 'src/common/dto/args/pagination.args';
import { PaginatedReservations } from './model/paginated-reservations.model';

@Resolver(() => Reservation)
export class ReservationsResolver {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Query(() => Reservation, { name: 'reservation' })
  @UseGuards(JwtAuthGuard)
  async getReservation(
    @Args('id', { type: () => String }, ParseUUIDPipe) id: string,
  ): Promise<Reservation> {
    return this.reservationsService.findOne(id);
  }

  @Query(() => PaginatedReservations, { name: 'reservations' })
  @UseGuards(JwtAuthGuard)
  async getPaginatedReservations(
    @Args() paginationArgs: PaginationArgs,
  ): Promise<PaginatedReservations> {
    return this.reservationsService.findPaginatedReservations(paginationArgs);
  }

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

  @Mutation(() => Reservation)
  @UseGuards(JwtAuthGuard)
  async cancelReservation(
    @Args('id', { type: () => String }, ParseUUIDPipe) id: string,
  ) {
    return this.reservationsService.cancelReservation(id);
  }

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

  @ResolveField(() => Number, {
    description: 'Base value applied to the reservation',
    name: 'baseValue',
  })
  baseValue(@Parent() reservation: Reservation): number {
    return reservation.room.basePrice;
  }

  @ResolveField(() => Number, {
    description: 'Total weekend increment applied',
    name: 'weekendIncrement',
  })
  weekendIncrement(@Parent() reservation: Reservation): number {
    return this.reservationsService.calculateWeekendIncrement(reservation);
  }

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
