import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Train, TrainDocument } from '../trains/train.schema';

@Injectable()
export class SeatService {
    constructor(
        @InjectModel(Train.name) private readonly trainModel: Model<TrainDocument>,
    ) {}

    async findSeats(trainId: string, carriageNumber: number) {
        // 기차 아이디 기반 기차 조회회
        const train = await this.trainModel.findOne({ trainId }).exec();
        if(!train) {
            throw new NotFoundException(`Train with ID ${trainId} not found`);
        }

        // 해당 기차에서 특정 호차 찾기
        const carriage = train.seats.find(car => car.carriageNumber === carriageNumber);
        if (!carriage) {
            throw new NotFoundException(`Carriage ${carriageNumber} not found in train ${trainId}`);
        }

        return {
            carriageNumber: carriage.carriageNumber,
            availableSeats: carriage.seats.map(seat => ({
                seatNumber: seat.seatNumber,
                isAvailable: seat.status === 'available',
            })),
        };
    }
}
