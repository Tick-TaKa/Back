import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CardService } from './card.service';
import { Card } from './card.schema';

@Controller('cards')
export class CardController {
    constructor(private readonly cardService: CardService) {}

    @Get(':phoneNumber')
    async findCards(@Param('phoneNumber') phoneNumber: string) {
        return this.cardService.findCardsByPhoneNumber(phoneNumber);
    }
    
    @Post(':phoneNumber')
    async addCard(@Param('phoneNumber') phoneNumber: string, @Body() card: Card) {
        return this.cardService.addCardToUser(phoneNumber, card);
    }
}