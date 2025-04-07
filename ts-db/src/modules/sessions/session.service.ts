import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './session.schema'

@Injectable()
export class SessionService {
    constructor(
        @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
    ) {}

    async createSession(purpose: string, current_page: string): Promise<Session> {
        const now = new Date(); //  KST로 바꾸기기

        const newSession = new this.sessionModel({
            status: 'active',
            purpose,
            current_page,
            start_time: now,
            last_interaction: now,
            previous_pages: []
        })

        return await newSession.save();
    }

    async updateSession(sessionId: string, current_page: string): Promise<Session | null> {
        const session = await this.sessionModel.findOne({ sessionId }).exec();
        if (!session) return null;

        return await this.sessionModel.findOneAndUpdate(
            { sessionId },
            {
                $set: {
                    current_page,
                    last_interaction: new Date() // KST로 바꾸기
                },
                $push: { previous_pages: session.current_page }
            },
            { new: true }
        ).exec()
    }

    async endSession(sessionId: string, status: string, end_reason: string, current_page: string): Promise<void> {
        const session = await this.sessionModel.findOne({ sessionId }).exec();
        
        if (!session) {
            throw new Error('Session not found');
        }

        await this.sessionModel.updateOne(
            { sessionId },
            {
                $set: {
                    status,
                    end_reason,
                    current_page,
                    last_interaction: new Date()
                },
                $push: { previous_pages: session.current_page }
            },
        );
    }

}