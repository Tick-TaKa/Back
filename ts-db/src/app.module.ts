import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TrainModule } from './modules/trains/train.module';
import { SeatModule } from './modules/seats/seat.module';
import { ReservationModule } from './modules/reservations/reservation.module';  // ReservationModule 임포트


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TrainModule,
    SeatModule,
    ReservationModule,
  ],
})
export class AppModule {}
