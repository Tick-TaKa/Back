import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserCard, UserCardDocument, Card } from './card.schema';

@Injectable()
export class CardService {
    constructor(
        @InjectModel(UserCard.name) private readonly userCardModel: Model<UserCardDocument>,
    ) {}

    // 전화번호로 카드 조회
    async findCardsByPhoneNumber(phoneNumber: string): Promise<any[]> {
        const userCard = await this.userCardModel.findOne({ phoneNumber }).exec();

        if (!userCard) {
            return [];
        }

        const cardDetails = userCard.cards.map(card => ({
            cardId: card.cardId,
            cardNumber: card.cardNumber,
            cardCompany: card.cardCompany,
            expirationDate: card.expirationDate
        }));
        
        return cardDetails;
    }

    // 카드 추가
    async addCardToUser(phoneNumber: string, cardData: Card): Promise<{ status: string}> {
        let userCard = await this.userCardModel.findOne({ phoneNumber }).exec();

        if (!userCard) {
            userCard = new this.userCardModel({
                phoneNumber,
                cards: [cardData],
            });
        } else {
            userCard.cards.push(cardData);
        }

        await userCard.save();
        return { status: 'card registered'};
    }
}