import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './session.schema';
import { Log, LogDocument } from '../logs/log.schema';

@Injectable()
export class SessionService {
    constructor(
        @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
        @InjectModel(Log.name) private readonly logModel: Model<LogDocument>,
    ) {}

    async createSession(purpose: string, current_page: string): Promise<Session> {
        const now = new Date();
        const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

        const newSession = new this.sessionModel({
            status: 'active',
            purpose,
            current_page,
            start_time: kstNow,
            last_interaction: kstNow,
            previous_pages: []
        })

        return await newSession.save();
    }

    async updateSession(sessionId: string, newPurpose? : string): Promise<Session | null> {
        const session = await this.sessionModel.findOne({ sessionId }).exec();
        if (!session) {
            throw new BadRequestException(`Session with ID ${sessionId} not found`);
        }

        const now = new Date();
        const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

        const updateSetFields: any = {
            last_interaction: kstNow
        };

        if (newPurpose && newPurpose !== session.purpose) {
            updateSetFields.purpose = newPurpose;

            await this.logModel.updateMany(
                { sessionId },
                { $set: { purpose: newPurpose } }
            );
        }

        // await this.logModel.updateOne(
        //     { sessionId },
        //     { $set: { location: current_page }}
        // ).exec();
        
        const updateQuery: any = {
            $set: updateSetFields,
        }

        if (!newPurpose || newPurpose === session.purpose) {
            updateQuery.$push = { previous_pages: session.current_page };
        }

        const updatedSession = await this.sessionModel.findOneAndUpdate(
            { sessionId },
            updateQuery,
            { new: true }
        ).exec()

        return updatedSession;
    }

    async endSession(sessionId: string, status: string, end_reason: string, current_page: string): Promise<void> {
        const session = await this.sessionModel.findOne({ sessionId }).exec();
        
        if (!session) {
            throw new Error(`Session with ID ${sessionId} not found-sessionEnd`);
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

        await this.logModel.updateOne(
            { sessionId },
            { $set: { location: current_page } }
        )
    }

}