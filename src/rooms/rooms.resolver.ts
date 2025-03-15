import { Resolver, Query, Args } from '@nestjs/graphql';
import { RoomsService } from './rooms.service';
import { Room } from './model/room.model';
import { AvailableRoomsArgs } from './dto/args/available-rooms.args';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PagedAvailableRoomResult } from './model/paged-available-room-result.model';
import { PaginationArgs } from '../common/dto/args/pagination.args';

@Resolver(() => Room)
export class RoomsResolver {
  constructor(private readonly roomsService: RoomsService) {}

  @Query(() => [String], {
    name: 'roomTypes',
    description: 'Get all room types',
  })
  @UseGuards(JwtAuthGuard)
  async getRoomTypes(): Promise<string[]> {
    return this.roomsService.findAllRoomTypes();
  }

  @Query(() => PagedAvailableRoomResult, {
    name: 'availableRooms',
    description: 'Get available rooms based on criteria with pagination',
  })
  @UseGuards(JwtAuthGuard)
  async getAvailableRooms(
    @Args() availableRoomsArgs: AvailableRoomsArgs,
    @Args() paginationArgs: PaginationArgs,
  ): Promise<PagedAvailableRoomResult> {
    return this.roomsService.findAvailableRoomsPaginated(
      availableRoomsArgs,
      paginationArgs,
    );
  }
}
