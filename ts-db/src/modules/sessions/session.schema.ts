import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

export type SessionDocument = Session & Document;

@Schema({
    toJSON: {
        transform: (_doc, ret) => {
            delete ret._id;
            delete ret.__v;
        },
    },
})
export class Session {
    @Prop({ default: () => uuidv4(), unique: true })
    sessionId: string;

    @Prop({ required: true, enum: ['active', ' completed', 'timeout'] })
    status: string;

    @Prop({ required: true, enum: ['reservation', 'history', 'refund'] })
    purpose: string;

    @Prop({ enum: ['reservation_completed', 'history_completed', 'refund_completed', 'session_abandoned'], default: null })
    end_reason: string

    @Prop({ required: true })
    current_page: string

    @Prop({ required: true })
    start_time: Date

    @Prop({ required: true })
    last_interaction: Date

    @Prop({ required: true, type: [String] })
    previous_pages: string[]
}

export const SessionSchema = SchemaFactory.createForClass(Session);