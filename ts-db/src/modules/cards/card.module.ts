import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CardController } from './card.controller';
import { CardService } from './card.service';
import { UserCard, UserCardSchema } from './card.schema';

@Module({
    imports: [
    MongooseModule.forFeature([{ name: UserCard.name, schema: UserCardSchema }]),
    ],
    controllers: [CardController],
    providers: [CardService],
})
export class CardModule {}
