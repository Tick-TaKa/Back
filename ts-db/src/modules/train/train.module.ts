import { Module } from '@nestjs/common';
import { TrainService } from './train.service';
import { TrainController } from './train.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Train, TrainSchema } from './train.schema';

@Module({
    imports: [
    MongooseModule.forFeature([{ name: Train.name, schema: TrainSchema }]),
    ],
    controllers: [TrainController],
    providers: [TrainService],
})

export class TrainModule {}