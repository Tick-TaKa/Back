import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Train, TrainDocument } from './train.schema';

@Injectable()
export class TrainService {
    constructor(
        @InjectModel(Train.name) private readonly trainModel: Model<TrainDocument>,
    ) {}

    async findTrains(departure: string, destination: string, date: string) {
        const trains = await this.trainModel.find({
            departure,
            arrival: destination,
            departureDate: date,
        }).exec();

        if(!trains || trains.length === 0) {
            throw new NotFoundException('No trains found for given criteria');
        }

        const TrainResponseDto = trains.map((train) => ({
            trainId: train.trainId,
            departureTime: train.departureTime,
            arrivalTime: train.arrivalTime,
            price: train.price.adult, // 성인 가격만 반환
            availableSeats: this.getAvailableSeats(train),
        }));

        return { trains: TrainResponseDto };
    }

    private getAvailableSeats(train: Train) {
        return train.seats.reduce((availableCount, carriage) => {
            return availableCount + carriage.seats.filter(seat => seat.status === 'available').length;
        }, 0);
    }

    // 기차 조회 매서드
    async findTrainById(trainId: string): Promise<Train> {
        const train = await this.trainModel.findOne({ trainId }).exec();
        if (!train) {
            throw new Error('Train not found');
        }
        return train;
    }

    // 기차 좌석 정보 업데이트
    async updateTrainSeats(trainId: string, seats: any[]): Promise<void> {
        await this.trainModel.updateOne(
            { trainId },
            { $set: { seats } },
        ).exec();
    }
}