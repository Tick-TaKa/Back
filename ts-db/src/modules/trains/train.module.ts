import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Train, TrainSchema } from './train.schema';
import { TrainService } from './train.service';
import { TrainController } from './train.controller';

@Module({
    imports: [MongooseModule.forFeature([{ name: Train.name, schema: TrainSchema }])],
    providers: [TrainService],
    controllers: [TrainController],
    exports: [TrainService],
})
export class TrainModule {}
