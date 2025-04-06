import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Reservation } from "../types/reservation";
import "../styles/BookingDetail.css";
import styles from "../styles/Button.module.css";
import styleb from "../styles/Box.module.css";
import RefundModal from "../components/RefundModal";

interface LocationState {
    reservations: Reservation[];
}

const BookingDetail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { reservations } = location.state as LocationState;

    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleRefund = () => {
        setIsModalOpen(true);
    };

    const confirmRefund = () => {
        setIsModalOpen(false);
        navigate("/history/refund-success");
    };

    const cancelRefund = () => {
        setIsModalOpen(false);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const totalPassengers = reservations.reduce(
        (acc, cur) =>
            acc +
            cur.passengerCount.adult +
            cur.passengerCount.senior +
            cur.passengerCount.youth,
        0
    );

    const totalPrice = totalPassengers * 10000;

    return (
        <>
            <div
                className={`${styleb.box} detail-box ${
                    isModalOpen ? "blurred" : ""
                }`}
            >
                <h3 className="page-title">티켓 상세 내역</h3>
                <hr className="page-title-bar"></hr>

                {reservations.map((res) => (
                    <div key={res.reservationId} className="route-box">
                        <div className="route-detail">
                            <p>출발</p>
                            <p className="booking-detail-station">
                                {res.departure}역
                            </p>
                            <span>{res.departureTime}</span>
                        </div>
                        <span className="arrow">→</span>
                        <div className="route-detail">
                            <p>도착</p>
                            <p className="booking-detail-station">
                                {res.arrival}역
                            </p>
                            <span>{res.arrivalTime}</span>
                        </div>
                    </div>
                ))}

                <div className="passenger-info">
                    <p>
                        <strong>총 인원 수: {totalPassengers}명</strong>
                    </p>
                    <p>
                        성인:{" "}
                        {reservations.reduce(
                            (acc, cur) => acc + cur.passengerCount.adult,
                            0
                        )}
                    </p>
                    <p>
                        노약자:{" "}
                        {reservations.reduce(
                            (acc, cur) => acc + cur.passengerCount.senior,
                            0
                        )}
                    </p>
                    <p>
                        어린이:{" "}
                        {reservations.reduce(
                            (acc, cur) => acc + cur.passengerCount.youth,
                            0
                        )}
                    </p>
                </div>

                <hr className="page-title-bar"></hr>

                <div className="price-info">
                    <strong>총액: {totalPrice.toLocaleString()}원</strong>
                </div>

                <p className="title-card-info">카드 정보</p>
                <hr className="page-title-bar"></hr>
                <div className="card-number">
                    <p>카드 번호</p>
                    <p className="card-number-info">
                        <strong>1111 2222 3333 ****</strong>
                    </p>
                </div>
            </div>
            {/* detail -> history 페이지로 가는 이전 버튼 */}
            <button
                id="detail-to-history"
                className={`${styles.button} detail-to-history`}
                onClick={handleBack}
            >
                이전
            </button>
            {/* detail -> refund 페이지로 가는 이전 버튼 */}
            <button
                id="detail-to-refund"
                className={`${styles.button} detail-to-refund`}
                onClick={handleRefund}
            >
                환불하기
            </button>
            {isModalOpen && (
                <RefundModal
                    onConfirm={confirmRefund}
                    onCancel={cancelRefund}
                />
            )}
        </>
    );
};

export default BookingDetail;
