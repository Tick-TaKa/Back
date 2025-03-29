import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TrainModule } from './modules/trains/train.module';
import { SeatModule } from './modules/seats/seat.module';
import { ReservationModule } from './modules/reservations/reservation.module';
import { CardModule } from './modules/cards/card.module';
import { RefundModule } from './modules/refunds/refund.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    TrainModule,
    SeatModule,
    ReservationModule,
    CardModule,
    RefundModule,
  ],
})
export class AppModule {}
