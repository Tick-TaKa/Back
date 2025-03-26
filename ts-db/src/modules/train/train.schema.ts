import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TrainDocument = Train & Document;

@Schema()
export class Seat {
    @Prop({ required: true })
    seatNumber: string;

    @Prop({ required: true, enum: ['available', 'reserved'] })
    status: string;
}

export const SeatSchema = SchemaFactory.createForClass(Seat);

@Schema()
export class Carriage {
    @Prop({ required: true })
    carriageNumber: number;

    @Prop({ type: [SeatSchema], required: true })
    seats: Seat[];
}

export const CarriageSchema = SchemaFactory.createForClass(Carriage);

@Schema()
export class Train {
    @Prop({ required: true, unique: true })
    trainId: string;

    @Prop({ required: true })
    departure: string;

    @Prop({ required: true })
    arrival: string;

    @Prop({ required: true })
    departureDate: string;

    @Prop({ required: true })
    departureTime: string;

    @Prop({ required: true })
    arrivalTime: string;

    @Prop({
        required: true,
        type: {
            adult: { type: Number, required: true },
            senior: { type: Number, required: true },
            youth: { type: Number, required: true },
        },
    })
    price: {
        adult: number;
        senior: number;
        youth: number;
    };

    @Prop({ type: [CarriageSchema], required: true })
    seats: Carriage[];
}

export const TrainSchema = SchemaFactory.createForClass(Train);