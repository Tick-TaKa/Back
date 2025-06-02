// [LLM] 예매 상세 내역 페이지 컴포넌트
// 환불 상세 정보 조회, 환불 여부 확인 모달, 로그 기록 및 세션 업데이트 포함

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/BookingDetail.css";
import styles from "../styles/Button.module.css";
import styleb from "../styles/Box.module.css";
import RefundModal from "../components/RefundModal";
import { addHistoryLog, updateHistorySession } from "../utils/session";
import axios from "axios";

// [LLM] 환불 상세 정보를 나타내는 인터페이스
interface RefundDetails {
    reservationId: string;
    departure: string;
    arrival: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    passengerCount: {
        adult: number;
        senior: number;
        youth: number;
        total: number;
    };
    refundAmount: number;
    paymentMethod: {
        type: "card" | "kakao" | "mobile";
        cardNumber: string;
    };
}

// [LLM] 페이지 진입 시 router state로 받은 예약 ID 구조
interface LocationState {
    reservations: { reservationId: string }[];
}

const BookingDetail = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // [LLM] router로 전달받은 예약 ID (배열 중 첫 번째 항목 기준)
    const locationState = location.state as LocationState | null;
    const reservationId = locationState?.reservations?.[0]?.reservationId ?? "";

    // [LLM] 상태 정의
    const [refundDetails, setRefundDetails] = useState<RefundDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // [LLM] 세션 불러오고 BookingDetail 도착 로그 기록
    useEffect(() => {
        const sessionRaw = localStorage.getItem("currentHistorySession");
        if (!sessionRaw) return;
        const session = JSON.parse(sessionRaw);
        setSessionId(session.sessionId);

        updateHistorySession({
            sessionId: session.sessionId,
            current_page: "BookingDetail",
        });

        const alreadyLogged = session.logs?.some(
            (log: any) =>
                log.page === "BookingDetail" &&
                log.event === "navigate" &&
                log.target_id === "page-load"
        );

        if (!alreadyLogged) {
            addHistoryLog({
                sessionId: session.sessionId,
                page: "BookingDetail",
                event: "navigate",
                target_id: "page-load",
                tag: "system",
                text: "BookingDetail 페이지 도착",
            });
        }
    }, []);

    // [LLM] 예약 ID 기준으로 백엔드 환불 상세 정보 조회
    useEffect(() => {
        if (!reservationId) return;

        axios
            .get(`http://localhost:3000/refunds/${reservationId}`)
            .then((res) => setRefundDetails(res.data))
            .catch((err) => {
                console.error("환불 정보 조회 실패:", err);
                setRefundDetails(null);
            });
    }, [reservationId]);

    // [LLM] 뒤로가기 버튼 → 이전 페이지로
    const handleBack = () => navigate(-1);

    // [LLM] 환불 버튼 클릭 → 모달 열고 로그 기록
    const handleRefund = () => {
        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "BookingDetail",
                event: "click",
                target_id: "detail-to-refund",
                tag: "button",
                text: "bookingdetail에서 환불하기 버튼 클릭",
            });
        }
        setIsModalOpen(true);
    };

    // [LLM] 환불 모달에서 예 클릭 → 로그 기록 + 세션 종료 + 환불 성공 페이지 이동
    const confirmRefund = () => {
        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "RefundModal",
                event: "click",
                target_id: "refundModal-yes-to-success",
                tag: "button",
                text: "RefundModal에서 yes 클릭, 환불 성공",
            });

            updateHistorySession({
                sessionId,
                end_reason: "refund_success",
            });
        }

        setIsModalOpen(false);
        navigate("/history/refund-success", {
            state: {
                reservations: [{ reservationId }],
            },
        });
    };

    // [LLM] 환불 모달에서 아니오 클릭 → 로그 기록 + 모달 닫기
    const cancelRefund = () => {
        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "RefundModal",
                event: "click",
                target_id: "refundModal-no-to-success",
                tag: "button",
                text: "RefundModal에서 no 클릭으로 환불 취소",
            });
        }
        setIsModalOpen(false);
    };

    return (
        <>
            {/* [LLM] 상세 정보 컨테이너 (모달 열릴 때 블러 처리) */}
            <div
                className={`${styleb.box} detail-box ${
                    isModalOpen ? "blurred" : ""
                }`}
            >
                <h3 className="page-title">티켓 상세 내역</h3>
                <hr className="page-title-bar" />

                {/* [LLM] 환불 정보가 존재할 때만 상세 내용 표시 */}
                {refundDetails && (
                    <>
                        {/* [LLM] 출발 → 도착 정보 */}
                        <div className="route-box">
                            <div className="route-detail">
                                <p>출발</p>
                                <p className="booking-detail-station">
                                    {refundDetails.departure}역
                                </p>
                                <span>{refundDetails.departureTime}</span>
                            </div>
                            <span className="arrow">→</span>
                            <div className="route-detail">
                                <p>도착</p>
                                <p className="booking-detail-station">
                                    {refundDetails.arrival}역
                                </p>
                                <span>{refundDetails.arrivalTime}</span>
                            </div>
                        </div>

                        {/* [LLM] 인원 수 정보 */}
                        <div className="passenger-info">
                            <p>
                                <strong>
                                    총 인원 수: {refundDetails.passengerCount.total}명
                                </strong>
                            </p>
                            <p>성인: {refundDetails.passengerCount.adult}</p>
                            <p>노약자: {refundDetails.passengerCount.senior}</p>
                            <p>어린이: {refundDetails.passengerCount.youth}</p>
                        </div>

                        <hr className="page-title-bar" />

                        {/* [LLM] 환불 금액 정보 */}
                        <div className="price-info">
                            <strong>
                                총 환불액: {refundDetails.refundAmount.toLocaleString()}원
                            </strong>
                        </div>

                        {/* [LLM] 결제 수단이 카드일 경우 카드 번호 표시 */}
                        {refundDetails.paymentMethod.type === "card" ? (
                            <>
                                <p className="title-card-info">카드 정보</p>
                                <hr className="page-title-bar" />
                                <div className="card-number">
                                    <p>카드 번호</p>
                                    <p className="card-number-info">
                                        <strong>
                                            {refundDetails.paymentMethod.cardNumber.replace(
                                                /\d{4}$/,
                                                "****"
                                            )}
                                        </strong>
                                    </p>
                                </div>
                            </>
                        ) : (
                            // [LLM] 카드가 아닌 결제 수단 (카카오페이 / 휴대폰 결제)
                            <>
                                <p className="title-card-info">
                                    {refundDetails.paymentMethod.type === "kakao"
                                        ? "카카오페이"
                                        : refundDetails.paymentMethod.type === "mobile"
                                        ? "휴대폰 결제"
                                        : "결제 정보"}
                                </p>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* [LLM] 이전 버튼 */}
            <button
                id="detail-to-history"
                className={`${styles.button} detail-to-history`}
                onClick={handleBack}
            >
                이전
            </button>

            {/* [LLM] 환불하기 버튼 */}
            <button
                id="detail-to-refund"
                className={`${styles.button} detail-to-refund`}
                onClick={handleRefund}
            >
                환불하기
            </button>

            {/* [LLM] 환불 확인 모달 */}
            {isModalOpen && (
                <RefundModal onConfirm={confirmRefund} onCancel={cancelRefund} />
            )}
        </>
    );
};

export default BookingDetail;
