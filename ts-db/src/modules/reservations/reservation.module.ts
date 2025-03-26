import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Reservation, ReservationSchema } from './reservation.schema';
import { TrainModule } from '../trains/train.module';  // TrainModule을 임포트

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Reservation.name, schema: ReservationSchema }]),
    TrainModule,  // TrainModule을 imports에 추가
  ],
  providers: [ReservationService],
  controllers: [ReservationController],
})
export class ReservationModule {}
