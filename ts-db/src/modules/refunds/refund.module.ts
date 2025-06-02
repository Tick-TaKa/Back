import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RefundService } from './refund.service';
import { RefundController } from './refund.controller';
import { Reservation, ReservationSchema } from '../reservations/reservation.schema';
import { Train, TrainSchema } from '../trains/train.schema';
import { TrainModule } from '../trains/train.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Reservation.name, schema: ReservationSchema },
            { name: Train.name, schema: TrainSchema }
        ]),
        TrainModule,
    ],
    controllers: [RefundController],
    providers: [RefundService],
})
export class RefundModule {}