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
        const train = await this.trainModel.findOne({ trainId }).exec();
        if(!train) {
            throw new NotFoundException(`Train with ID ${trainId} not found`);
        }

        const carriage = train.seats.find(car => car.carriageNumber === carriageNumber);
        if (!carriage) {
            throw new NotFoundException(`Carriage ${carriageNumber} not found in train ${trainId}`);
        }

        const seats = carriage.seats.map(seat => ({
            seatNumber: seat.seatNumber,
            isAvailable: seat.status === 'available',
        }));

        if (seats.length === 0) {
            throw new NotFoundException('No seats found for the given train and carriage');
        }

        return {
            carriageNumber: carriage.carriageNumber,
            availableSeats: seats,
        };
    }
}
