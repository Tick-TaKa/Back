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
        const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000); // 일단 10분에 한 번씩 확인하는 걸로 설정 -> 나중에 시간 변경 가능

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