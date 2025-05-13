import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LLMService } from './llm.service';
import { LLMController } from './llm.controller';
import { Session, SessionSchema } from '../sessions/session.schema';
import { Log, LogSchema } from '../logs/log.schema';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Session.name, schema: SessionSchema },
            { name: Log.name, schema: LogSchema },
        ]),
        HttpModule,
    ],
    controllers: [LLMController],
    providers: [LLMService],
})
export class LLMModule {}