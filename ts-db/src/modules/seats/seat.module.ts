import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeatController } from './seat.controller';
import { SeatService } from './seat.service';
import { Train, TrainSchema } from '../trains/train.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Train.name, schema: TrainSchema }])],
    controllers: [SeatController],
    providers: [SeatService],
})

export class SeatModule {}
