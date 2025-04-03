import { Controller, Post, Body, Param } from '@nestjs/common';
import { ReservationService } from './reservation.service';

@Controller('reservations')
export class ReservationController {
    constructor(private readonly reservationService: ReservationService) {}

    @Post()
    async create(@Body() body: any) {
        const result = await this.reservationService.createReservation(body);
        return result;
    }

    @Post('search')
    async getReservation(@Body() body: {phoneNumber: string; endDate: string }) {
        return await this.reservationService.getReservation(body.phoneNumber,body.endDate);
    }
}