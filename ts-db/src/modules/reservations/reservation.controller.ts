import { Controller, Post, Body } from '@nestjs/common';
import { ReservationService } from './reservation.service';

@Controller('reservations')
export class ReservationController {
    constructor(private readonly reservationService: ReservationService) {}

    @Post()
    async create(@Body() body: any) {
        const result = await this.reservationService.createReservation(body);
        return result;
    }
}