import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';


@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: async (configService: ConfigService) => ({
                uri: configService.get<string>('MONGO_URI'),  // 환경 변수에서 MongoDB 주소 가져오기
        }),
        inject: [ConfigService],
        }),
    ],
    exports: [MongooseModule],  // 다른 모듈에서 Mongoose 사용 가능하게 설정
})
export class DatabaseModule {}
