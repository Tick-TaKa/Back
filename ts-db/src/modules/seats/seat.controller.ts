import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { SeatService } from './seat.service';

@Controller('seats')
export class SeatController {
    constructor(private readonly seatService: SeatService) {}

    @Get(':trainId/:carriageNumber')
    async getSeats(
        @Param('trainId') trainId: string,
        @Param('carriageNumber') carriageNumber: string
    ) {
        const seats = await this.seatService.findSeats(trainId, Number(carriageNumber));
        if (!seats) {
            throw new NotFoundException('No seats found for the given train and carriage');
        }
        return seats;
    }
}