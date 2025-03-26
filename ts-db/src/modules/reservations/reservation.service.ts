import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument } from './reservation.schema';
import { v4 as uuidv4 } from 'uuid';
import { TrainService } from '../trains/train.service';

@Injectable()
export class ReservationService {
    constructor(
        @InjectModel(Reservation.name) private readonly reservationModel: Model<ReservationDocument>,
        private readonly trainService: TrainService,
    ) {}

    // 예매 생성
    async createReservation(body: any): Promise<{ success: boolean, message: string }> {
        const { trainId, carriageNumber, seatNumbers, phoneNumber, passengerCount, paymentMethod, cardNumber } = body;

        // 카드 결제 시 카드 번호 체크
        if (paymentMethod === 'card' && !cardNumber) {
            throw new BadRequestException('Card number is required for card payment');
        }

        // 예약 ID 생성성
        const reservationId = uuidv4();

        // 기차 정보 조회
        const train = await this.trainService.findTrainById(trainId);
        if (!train) {
            throw new BadRequestException('Train not found');
        }

        // 호차 정보 조회
        const carriage = train.seats.find(car => car.carriageNumber === carriageNumber);
        if (!carriage) {
            throw new BadRequestException('Carriage not found');
        }

        // 좌석 배열에 대해 예약 상태 변경
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

        // 기차 정보 업데이트
        await this.trainService.updateTrainSeats(trainId, train.seats); // 기차 모델에 좌석 상태 저장

        // 가격 계산
        const adultPrice = train.price.adult;
        const seniorPrice = train.price.senior;
        const youthPrice = train.price.youth;

        const totalAmount =
            (passengerCount.adult * adultPrice) +
            (passengerCount.senior * seniorPrice) +
            (passengerCount.youth * youthPrice);

        // 현재 한국 시간(KST) 기준으로 날짜 포맷팅 (년-월-일 형식)
        const reservationDate = new Date();
        const koreaTime = new Date(reservationDate.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const formattedDate = koreaTime.toISOString().split('T')[0];

        // 예매 정보 저장
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
}
