import { Controller, Delete, Get, Param } from '@nestjs/common';
import { RefundService } from './refund.service';

@Controller('refunds')
export class RefundController {
    constructor(private readonly refundService: RefundService) {}

    @Get(':reservationId')
    async getRefundDetails(@Param('reservationId') reservationId: string) {
        return await this.refundService.getRefundDetails(reservationId);
    }

    @Delete(':reservationId')
    async refund(@Param('reservationId') reservationId: string): Promise<string> {
        return this.refundService.processRefund(reservationId);
    }
}