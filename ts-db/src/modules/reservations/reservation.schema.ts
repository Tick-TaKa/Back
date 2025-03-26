import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReservationDocument = Reservation & Document;

@Schema()
export class Reservation {
    @Prop({ required: true, unique: true })
    reservationId: string;

    @Prop({ required: true })
    phoneNumber: string;

    @Prop({ required: true })
    trainId: string;

    @Prop({ required: true })
    carriageNumber: number;

    @Prop({ required: true, type: [String] })
    seatNumbers: string[];

    @Prop({
        required: true,
        type: {
            adult: { type: Number, required: true },
            senior: { type: Number, required: true },
            youth: { type: Number, required: true },
        },
        _id: false,
    })
    passengerCount: {
        adult: number;
        senior: number;
        youth: number;
    };    

    @Prop({ required: true })
    totalAmount: number;

    @Prop({ required: true, enum: ['card', 'kakaopay', 'phone'] })
    paymentMethod: string;

    @Prop({
        required: function (this: Reservation) {
            return this.paymentMethod === 'card';
        },
    })
    cardNumber?: string;

    @Prop({ required: true })
    reservationDate: Date;
}
export const ReservationSchema = SchemaFactory.createForClass(Reservation);
