import { Controller, Get, Query } from '@nestjs/common';
import { TrainService } from './train.service';

@Controller('trains')
export class TrainController {
    constructor(private readonly trainService: TrainService) {}

    @Get()
    async findTrains(
        @Query('departure') departure: string,
        @Query('destination') destination: string,
        @Query('date') date: string
    ) {
        return this.trainService.findTrains(departure, destination, date);
    }
}
