import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';


export type UserCardDocument = UserCard & Document;

@Schema({ _id: false })
export class Card {
    @Prop({ default: () => uuidv4(), unique: true })
    cardId: string;

    @Prop({ required: true })
    cardCompany: string;

    @Prop({ required: true })
    cardNumber: string;

    @Prop({ required: true })
    cvc: string;

    @Prop({ required: true })
    expirationDate: string

    @Prop({ required: true })
    password: string;
}

export const CardSchema = SchemaFactory.createForClass(Card);

@Schema()
export class UserCard {
    @Prop({ required: true, unique: true })
    phoneNumber: string;

    @Prop({ type: [CardSchema], default: [] })
    cards: Card[];
}

export const UserCardSchema = SchemaFactory.createForClass(UserCard);