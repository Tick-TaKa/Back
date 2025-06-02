import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionTimeoutService } from './session-timeout.service';
import { SessionController } from './session.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './session.schema';
import { Log, LogSchema } from '../logs/log.schema';

@Module({
    imports: [MongooseModule.forFeature([
        { name: Session.name, schema: SessionSchema },
        { name: Log.name, schema: LogSchema},
    ])],
    providers: [SessionService, SessionTimeoutService],
    controllers: [SessionController],
})

export class SessionModuel {}