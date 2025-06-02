import { Injectable} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from '../logs/log.schema';
import { Session, SessionDocument } from '../sessions/session.schema';
import { HttpService as AxiosHttpService} from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LLMService {
    constructor(
        private readonly httpService: AxiosHttpService,
        @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
        @InjectModel(Log.name) private readonly logModel: Model<LogDocument>,
    ) {}

    async handleLLMRequest(sessionId: string, question: string): Promise<any> {
        const currentLogDoc = await this.logModel.findOne({ sessionId });

        if (!currentLogDoc) {
            throw new Error(`No logs found for sessionId: ${sessionId}`);
        }

        const currentPurpose = currentLogDoc.purpose
        
        const completedSessionDocs = await this.sessionModel
        .find({ status: 'completed', purpose: currentPurpose })
        .select('sessionId')
        .lean();

        const completedSessionIds = completedSessionDocs.map(session => session.sessionId);

        const completedLogsDocs = await this.logModel.find({
            sessionId: { $in: completedSessionIds },
        });

        const completedLogs = completedLogsDocs.map((doc) => doc.logs);

        const payload = {
            question,
            current_session: {
                sessionId: currentLogDoc.sessionId,
                purpose: currentLogDoc.purpose,
                location: currentLogDoc.location,
                logs: currentLogDoc.logs,
            },
            completed_session: {
                purpose: currentPurpose,
                logs: completedLogs,
            },
        };

        const llmUrl = 'http://localhost:8000' // LLM api 주소
        const response = await firstValueFrom(this.httpService.post(llmUrl, payload));
        return response
    }
}