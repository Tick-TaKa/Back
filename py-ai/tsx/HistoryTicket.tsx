// [LLM] 예약 내역이 존재할 때 History 페이지 내에 예매 정보들이 표시되는 컴포넌트
import React from "react";
import { useNavigate } from "react-router-dom";
import { addHistoryLog } from "../utils/session";
import "../styles/History.css";
import "../styles/HistoryTicket.css";
import { Reservation } from "../pages/History";

// [LLM] props: 1) 예약 객체, 2) 선택 여부, 3) 선택 토글 함수
interface HistoryTicketProps {
    reservation: Reservation;
    isSelected: boolean;
    onToggle: (id: string) => void;
}

const HistoryTicket: React.FC<HistoryTicketProps> = ({
    reservation,
    isSelected,
    onToggle,
}) => {
    // [LLM] reservation 객체 디스트럭처링
    const {
        reservationId,
        departure,
        arrival,
        departureDate,
        departureTime,
        arrivalTime,
        passengerCount,
        carriageNumber,
        seatNumbers,
    } = reservation;

    const navigate = useNavigate();

    // [LLM] currentHistorySession 불러와서 sessionId 추출
    const session = JSON.parse(
        localStorage.getItem("currentHistorySession") || "{}"
    );
    const sessionId = session?.sessionId;

    // [LLM] 티켓 클릭 시: 로그 기록 + BookingDetail 페이지로 이동
    const handleTicketClick = () => {
        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "History",
                event: "click",
                target_id: "ticket-info",
                tag: "div",
                text: `${departure} to ${arrival} 티켓 클릭`,
                url: window.location.pathname,
            });
        }

        navigate("/history/booking-detail", { // [LLM] BookingDetail 페이지로 이동
            state: {
                reservations: [
                    {
                        ...reservation,
                        trainInfo: reservation.trainInfo,
                    },
                ],
            },
        });
    };

    // [LLM] 체크박스 선택/해제 시 로그 기록 및 상태 업데이트
    const handleCheckboxChange = () => {
        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "HistoryTicket",
                event: "click",
                target_id: `history-ticket-checkbox`,
                tag: "checkbox",
                text: "티켓 부분 선택 체크 박스",
                url: window.location.pathname,
            });
        }
        onToggle(reservationId); // 상위에서 선택 목록 관리
    };

    return (
        // [LLM] 개별 티켓 컨테이너. 선택된 경우 'selected' 클래스 추가됨
        <div className={`ticket-container ${isSelected ? "selected" : ""}`}>
            {/* [LLM] 부분 환불용 체크박스 */}
            <input
                id={`history-ticket-checkbox`}
                className="history-ticket-checkbox"
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
            />

            <div className="ticket-content">
                {/* [LLM] 왼쪽 시각적 강조 바 */}
                <div className="ticket-left-bar"></div>

                {/* [LLM] 클릭 시 상세 페이지 이동 */}
                <div
                    id="ticket-info"
                    className="ticket-info"
                    onClick={handleTicketClick}
                    style={{ cursor: "pointer" }}
                >
                    {/* [LLM] 상단에 출발, 도착 표시하여 출발역과 도착역에 대한 정보 제공 */}
                    <div className="route-row">
                        <span className="start-label">출발</span>
                        <div className="station-block">
                            <span className="station">{departure}역</span>
                            <span>{departureTime.split("T")[0]}</span>
                        </div>
                        <span className="arrow">→</span>
                        <span className="arrive-label">도착</span>
                        <div className="station-block">
                            <span className="station">{arrival}역</span>
                            <span>{arrivalTime}</span>
                        </div>
                    </div>

                    {/* [LLM] details 안에 들어갈 세부 정보: 출발일, 인원 수, 좌석 정보 */}
                    <div className="details">
                        <div className="detail-item">
                            <span className="label">출발일</span>
                            <span className="value">{departureDate}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">예약자</span>
                            <span className="value">
                                {passengerCount.adult
                                    ? `성인 ${passengerCount.adult}명`
                                    : ""}
                                {passengerCount.senior
                                    ? ` 노약자 ${passengerCount.senior}명`
                                    : ""}
                                {passengerCount.youth
                                    ? ` 청소년 ${passengerCount.youth}명`
                                    : ""}
                            </span>
                        </div>

                        {/* [LLM] 좌석 정보가 존재하는 경우에만 표시 */}
                        {seatNumbers.length > 0 && (
                            <div className="detail-item">
                                <span className="label">예약좌석</span>
                                <span className="value">
                                    {carriageNumber}호차 {seatNumbers.join(", ")}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryTicket;
