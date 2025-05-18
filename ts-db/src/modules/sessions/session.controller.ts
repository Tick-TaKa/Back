import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { SessionService } from './session.service'

@Controller('sessions')
export class SessionController {
    constructor(private readonly sessionService: SessionService) {}

    @Post('start')
    async createSession(@Body() body: {purpose: string; current_page: string}) {
        return await this.sessionService.createSession(body.purpose, body.current_page);
    }

    @Patch('update')
    async updateSession(@Body() body: {sessionId: string; current_page: string; newPurpose?: string}) {
        return this.sessionService.updateSession(body.sessionId, body.current_page, body.newPurpose);
    }

    @Patch('end')
    async endSession(@Body() body: {sessionId: string, status: string, end_reason: string, current_page: string}) {
        await this.sessionService.endSession(body.sessionId, body.status, body.end_reason, body.current_page);
        return { message: "Session ended successfully" };
    }
}