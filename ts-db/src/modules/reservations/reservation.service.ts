import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument } from './reservation.schema';
import { v4 as uuidv4 } from 'uuid';
import { TrainService } from '../trains/train.service';
import { ReservationDetails } from './reservation.interface';

@Injectable()
export class ReservationService {
    constructor(
        @InjectModel(Reservation.name) private readonly reservationModel: Model<ReservationDocument>,
        private readonly trainService: TrainService,
    ) {}

    async createReservation(body: any): Promise<{ success: boolean, message: string }> {
        const { trainId, carriageNumber, seatNumbers, phoneNumber, passengerCount, paymentMethod, cardNumber } = body;

        if (paymentMethod === 'card' && !cardNumber) {
            throw new BadRequestException('Card number is required for card payment');
        }

        const reservationId = uuidv4();

        const train = await this.trainService.findTrainById(trainId);
        if (!train) {
            throw new BadRequestException('Train not found');
        }

        const carriage = train.seats.find(car => car.carriageNumber === carriageNumber);
        if (!carriage) {
            throw new BadRequestException('Carriage not found');
        }

        seatNumbers.forEach(seatNumber => {
            const seat = carriage.seats.find(s => s.seatNumber === seatNumber);
            if (!seat) {
                throw new BadRequestException(`Seat ${seatNumber} not found`);
            }
            if (seat.status === 'reserved') {
                throw new BadRequestException(`Seat ${seatNumber} is already reserved`);
            }
            seat.status = 'reserved';
        });

        await this.trainService.updateTrainSeats(trainId, train.seats); // 기차 모델에 좌석 상태 저장

        const adultPrice = train.price.adult;
        const seniorPrice = train.price.senior;
        const youthPrice = train.price.youth;

        const totalAmount =
            (passengerCount.adult * adultPrice) +
            (passengerCount.senior * seniorPrice) +
            (passengerCount.youth * youthPrice);

        const reservationDate = new Date();
        const koreaTime = new Date(reservationDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const formattedDate = koreaTime.toISOString().split('T')[0];

        const reservation = new this.reservationModel({
            reservationId,
            phoneNumber,
            trainId,
            carriageNumber,
            seatNumbers,
            passengerCount,
            totalAmount,
            paymentMethod,
            cardNumber,  // 카드 결제 방식일 때만 포함
            reservationDate: formattedDate,
        });

        await reservation.save();

        return { success: true, message: 'Reservation created successfully' };
    }

    async getReservation(phoneNumber: string, startDate: string, endDate: string): Promise<ReservationDetails[]> { // 배열로 여러 개 반환
        // const today = new Date();
        // const threeMonthAgo = new Date(today);
        // threeMonthAgo.setMonth(today.getMonth() - 3);

        const start = new Date(startDate);
        const end = new Date(endDate);
    
        const reservations = await this.reservationModel.find({ phoneNumber }).exec();
        const result: ReservationDetails[] = []; 

        for (const reservation of reservations) {
            const train = await this.trainService.findTrainById(reservation.trainId);
    
            if (train) {
                const departureDate = new Date(train.departureDate);

                if (departureDate >= start && departureDate <= end) {
                    result.push({
                        reservationId: reservation.reservationId,
                        departure: train.departure,
                        arrival: train.arrival,
                        departureDate: train.departureDate,
                        departureTime: train.departureTime,
                        arrivalTime: train.arrivalTime,
                        passengerCount: reservation.passengerCount,
                        carriageNumber: reservation.carriageNumber,
                        seatNumbers: reservation.seatNumbers,
                    });
                }
            }
        }
        return result;
    }
}