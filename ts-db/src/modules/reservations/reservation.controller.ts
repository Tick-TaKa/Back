import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationDetails } from './reservation.interface';

@Controller('reservations')
export class ReservationController {
    constructor(private readonly reservationService: ReservationService) {}

    @Post()
    async create(@Body() body: any) {
        const result = await this.reservationService.createReservation(body);
        return result;
    }

    @Get(':phoneNumber')
    async getReservation(@Param('phoneNumber') phoneNumber: string): Promise<ReservationDetails[]> {
        return await this.reservationService.getReservation(phoneNumber);
    }
}