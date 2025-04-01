import React, { useState } from "react";
import Calendar from "react-calendar";
import { useNavigate, useLocation } from "react-router-dom";
import RefundModalDetail from "../components/RefundModalDetail";
// import { TakaBox } from "../components/TakaBox";
import "react-calendar/dist/Calendar.css";
import "../styles/Reservation.css";
import "../styles/History.css";
import styleb from "../styles/Box.module.css";
import styles from "../styles/Button.module.css";
import HistoryTicket from "./HistoryTicket";
import HistoryNone from "./HistoryNone";

export interface Reservation {
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
    };
    carriageNumber: string;
    seatNumbers: string[];
}

const sampleReservations: Reservation[] = [
    {
        reservationId: "RES12345",
        departure: "서울",
        arrival: "부산",
        departureDate: "2025-03-20",
        departureTime: "08:30",
        arrivalTime: "12:00",
        passengerCount: {
            adult: 1,
            senior: 0,
            youth: 0,
        },
        carriageNumber: "1",
        seatNumbers: ["1A"],
    },
    {
        reservationId: "RES67890",
        departure: "부산",
        arrival: "서울",
        departureDate: "2025-04-05",
        departureTime: "15:00",
        arrivalTime: "18:30",
        passengerCount: {
            adult: 1,
            senior: 0,
            youth: 1,
        },
        carriageNumber: "1",
        seatNumbers: ["1C", "2D"],
    },
];

const History = () => {
    const location = useLocation();
    const phoneNumber = location.state?.phoneNumber || "고객";
    const maskedNumber = phoneNumber.slice(-4);

    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    const [startDate, setStartDate] = useState<Date>(threeMonthsAgo);
    const [endDate, setEndDate] = useState<Date>(today);
    const [selectingDate, setSelectingDate] = useState<"start" | "end">(
        "start"
    );
    const [selected, setSelected] = useState<string[]>([]);
    const [filteredReservations, setFilteredReservations] = useState<
        Reservation[]
    >([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // ✅ 모달 상태

    const navigate = useNavigate();

    const toggleSelect = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
        );
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "날짜 없음";
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    };

    const handleSearch = () => {
        const result = sampleReservations.filter((res) => {
            const depDate = new Date(res.departureDate);
            return depDate >= startDate && depDate <= endDate;
        });
        setFilteredReservations(result);
        setSelected([]);
        setHasSearched(true);
    };

    const handleRefundClick = () => {
        const selectedRes = filteredReservations.filter((res) =>
            selected.includes(res.reservationId)
        );

        if (selectedRes.length === 0) {
            alert("환불할 항목을 선택해주세요!");
            return;
        }

        setIsModalOpen(true); // ✅ 모달 열기
    };

    const confirmRefund = () => {
        const selectedRes = filteredReservations.filter((res) =>
            selected.includes(res.reservationId)
        );

        setIsModalOpen(false);
        navigate("/history/refund-success", {
            state: { reservations: selectedRes },
        });
    };

    const cancelRefund = () => {
        setIsModalOpen(false);
    };

    return (
        <div className={styleb.box}>
            <h3 className="page-title">
                <span className="user-id">{maskedNumber}</span> 님의 예매 내역
            </h3>
            <hr className="page-title-bar" />

            {/* 날짜 선택 UI */}
            <div className="date-section">
                <span>조회 기간</span>
                <span className="period">
                    <span
                        className={`clickable ${
                            selectingDate === "start" ? "active" : ""
                        }`}
                        onClick={() => setSelectingDate("start")}
                    >
                        {formatDate(startDate)}
                    </span>{" "}
                    ~{" "}
                    <span
                        className={`clickable ${
                            selectingDate === "end" ? "active" : ""
                        }`}
                        onClick={() => setSelectingDate("end")}
                    >
                        {formatDate(endDate)}
                    </span>
                </span>
            </div>

            <div className="calendar-wrapper">
                <Calendar
                    onChange={(value) => {
                        if (value instanceof Date) {
                            if (selectingDate === "start") {
                                setStartDate(value);
                                if (value > endDate) {
                                    setEndDate(value);
                                }
                            } else {
                                const newEnd =
                                    value < startDate ? startDate : value;
                                setEndDate(newEnd);
                            }
                        }
                    }}
                    value={selectingDate === "start" ? startDate : endDate}
                    selectRange={false}
                    minDate={
                        selectingDate === "start" ? threeMonthsAgo : undefined
                    }
                />
            </div>
            {/* history 조회 버튼 */}
            <button
                id="history-search"
                className={`${styles.button} history-look-up`}
                onClick={handleSearch}
            >
                조회
            </button>

            <div className="history-ticket">
                {hasSearched && filteredReservations.length === 0 ? (
                    <HistoryNone />
                ) : (
                    <>
                        <div className="selection-header">
                            <p>예매 내역</p>
                            <label className="selection-header-right">
                                <input
                                    className="checkbox"
                                    type="checkbox"
                                    checked={
                                        filteredReservations.length > 0 &&
                                        selected.length ===
                                            filteredReservations.length
                                    }
                                    onChange={(e) => {
                                        setSelected(
                                            e.target.checked
                                                ? filteredReservations.map(
                                                      (r) => r.reservationId
                                                  )
                                                : []
                                        );
                                    }}
                                />
                                전체 선택
                            </label>
                        </div>

                        <hr className="page-title-bar" />
                        <div className="ticket-list-containter">
                            <div className="ticket-list">
                                {filteredReservations.map((res) => (
                                    <HistoryTicket
                                        key={res.reservationId}
                                        reservation={res}
                                        isSelected={selected.includes(
                                            res.reservationId
                                        )}
                                        onToggle={toggleSelect}
                                    />
                                ))}
                            </div>

                            {filteredReservations.length > 0 && (
                                // 환불 버튼 클릭 시 RefundModal창으로 이동하는 버튼
                                <button
                                    id="history-refund"
                                    className={`${styles.button} history-refund`}
                                    onClick={handleRefundClick}
                                >
                                    선택항목 환불
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ✅ 모달 컴포넌트 */}
            {isModalOpen && (
                <RefundModalDetail
                    onConfirm={confirmRefund}
                    onCancel={cancelRefund}
                />
            )}
        </div>
    );
};

export default History;
