import { Controller, Post, Body } from '@nestjs/common';
import { LLMService } from './llm.service';

@Controller('llm')
export class LLMController {
    constructor(private readonly llmService: LLMService) {}

    @Post('ask')
    async askLLM(@Body() body: { sessionId: string; question: string }) {
        const response = await this.llmService.handleLLMRequest(body.sessionId, body.question);
        return response;
    }
}