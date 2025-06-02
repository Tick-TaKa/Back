import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Reservation, ReservationSchema } from './reservation.schema';
import { TrainModule } from '../trains/train.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Reservation.name, schema: ReservationSchema }]),
    TrainModule,
  ],
  providers: [ReservationService],
  controllers: [ReservationController],
})
export class ReservationModule {}
