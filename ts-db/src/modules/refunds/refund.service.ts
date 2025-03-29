import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Train, TrainDocument } from '../trains/train.schema';
import { TrainService } from '../trains/train.service';
import { Reservation, ReservationDocument } from '../reservations/reservation.schema';

@Injectable()
export class RefundService {
    constructor(
        @InjectModel(Train.name) private readonly trainModel: Model<TrainDocument>,
        @InjectModel(Reservation.name) private readonly reservationModel: Model<ReservationDocument>,
        private readonly trainService: TrainService,
    ) {}

    async getRefundDetails(reservationId: string) {
        const reservation = await this.reservationModel.findOne({ reservationId }).exec();
        if(!reservation) {
            throw new NotFoundException(`Reservation with ID ${reservationId} not found`)
        }

        const train = await this.trainService.findTrainById(reservation.trainId);
        if (!train) {
                    throw new BadRequestException('Train not found');
        }

        const passengerCount = {
            adult: reservation.passengerCount.adult,
            senior: reservation.passengerCount.senior,
            youth: reservation.passengerCount.youth,
            total: reservation.passengerCount.adult + reservation.passengerCount.senior + reservation.passengerCount.youth
        };

        const refundAmount = 
            (reservation.passengerCount.adult * train.price.adult) +
            (reservation.passengerCount.senior * train.price.senior) +
            (reservation.passengerCount.youth * train.price.youth);

        const paymentMethod: any = { type: reservation.paymentMethod };
        if (reservation.paymentMethod === 'card') {
            paymentMethod.cardNumber = reservation.cardNumber || null;
        }

        return {
            reservationId: reservation.reservationId,
            departure: train.departure,
            arrival: train.arrival,
            departureDate: train.departureDate,
            departureTime: train.departureTime,
            arrivalTime: train.arrivalTime,
            passengerCount,
            refundAmount,
            paymentMethod
        }
    }

    async processRefund(reservationId: string): Promise<string> {
        const reservation = await this.reservationModel.findOne({ reservationId }).exec();
        if(!reservation) {
            throw new NotFoundException(`Reservation with ID ${reservationId} not found`)
        }

        const train = await this.trainService.findTrainById(reservation.trainId);
        if (!train) {
                    throw new BadRequestException('Train not found');
        }

        for (const carriage of train.seats) {
            if (carriage.carriageNumber === reservation.carriageNumber) {
                carriage.seats.forEach(seat => {
                    if (reservation.seatNumbers.includes(seat.seatNumber)) {
                        seat.status = 'available';
                    }
                });
            }
        }

        await this.trainService.updateTrainSeats(reservation.trainId, train.seats);

        await this.reservationModel.deleteOne({ reservationId }).exec();

        return 'refund completed'
    }
}

