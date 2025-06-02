import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './session.schema'

@Injectable()
export class SessionTimeoutService {
    private readonly logger = new Logger(SessionTimeoutService.name);

    constructor(
        @InjectModel(Session.name) private sessionModel: Model<SessionDocument>
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async handleTimeoutSessions() {
        const now = new Date();
        const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const tenMinutesAgo = new Date(kstNow.getTime() - 5 * 60 * 1000); // 5분에 마다 종료

        const result = await this.sessionModel.updateMany (
            {
                status: 'active',
                last_interaction: { $lt: tenMinutesAgo },
            },
            {
                $set: {
                    status: 'timeout',
                    end_reason: 'session_abandoned',
                },
            },
        );

        if (result.modifiedCount > 0 ) {
            this.logger.log(`[TIMEOUT] ${result.modifiedCount} session(s) updated to timeout`);
        }
    }
}