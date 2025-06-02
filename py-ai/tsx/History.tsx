// [LLM] 예매 내역 확인 페이지 컴포넌트
import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import { useNavigate, useLocation } from "react-router-dom";
import { updateHistorySession, addHistoryLog } from "../utils/session";
import RefundModalDetail from "../components/RefundModalDetail";
import "react-calendar/dist/Calendar.css";
import "../styles/Reservation.css";
import "../styles/History.css";
import styleb from "../styles/Box.module.css";
import styles from "../styles/Button.module.css";
import HistoryTicket from "./HistoryTicket";
import HistoryNone from "./HistoryNone";
import axios from "axios";

// [LLM] 개별 예매 데이터에 대한 Reservation 객체 타입 정의
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
    trainInfo?: {
        price: number;
        departureTime: string;
        arrivalTime: string;
        trainId: string;
    };
}

const History = () => {
    // [LLM] 현재 페이지 라우팅 상태에서 전화번호, 세션 ID 추출
    const location = useLocation();
    const phoneNumber = location.state?.phoneNumber || "고객";
    const maskedNumber = phoneNumber.slice(-4);
    const sessionId = location.state?.sessionId;
    const navigate = useNavigate();

    // [LLM] 날짜 선택용: 기본값은 오늘과 3개월 전
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    // [LLM] 상태 변수 정의
    const [startDate, setStartDate] = useState<Date>(threeMonthsAgo); // 시작일
    const [endDate, setEndDate] = useState<Date>(today); // 종료일
    const [selectingDate, setSelectingDate] = useState<"start" | "end">(
        "start"
    ); // 현재 선택 중인 달력 유형
    const [selected, setSelected] = useState<string[]>([]); // 선택된 예약 ID 목록
    const [filteredReservations, setFilteredReservations] = useState<
        Reservation[]
    >([]); // 조회 결과
    const [hasSearched, setHasSearched] = useState(false); // 조회 실행 여부
    const [isModalOpen, setIsModalOpen] = useState(false); // 환불 모달 열림 여부

    // [LLM] 컴포넌트 마운트 시 히스토리 세션 업데이트 및 첫 로그 기록
    useEffect(() => {
        if (sessionId) {
            updateHistorySession({ location: "History" });

            const sessionRaw = localStorage.getItem("currentHistorySession");
            if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                const alreadyLogged = session.logs?.some(
                    (log: any) =>
                        log.page === "History" &&
                        log.event === "navigate" &&
                        log.target_id === "page-load"
                );
                if (!alreadyLogged) {
                    addHistoryLog({
                        sessionId,
                        page: "History",
                        event: "navigate",
                        target_id: "page-load",
                        tag: "system",
                        text: "History 페이지 도착",
                    });
                }
            }
        }
    }, [sessionId]);

    // [LLM] 단일 티켓 선택 또는 해제
    const toggleSelect = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
        );
    };

    // [LLM] 날짜 객체를 'YYYY-MM-DD' 형식의 문자열로 변환
    const formatDate = (date: Date | null) => {
        if (!date) return "날짜 없음";
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    };

    // [LLM] 서버에 예매 내역 조회 요청 → 날짜 범위 및 전화번호 기반 필터링
    const handleSearch = async () => {
        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "HistoryTicket",
                event: "click",
                target_id: "history-search",
                tag: "button",
                text: "날짜 조회",
            });
        }

        try {
            const response = await axios.post(
                "http://localhost:3000/reservations/search",
                {
                    phoneNumber: phoneNumber.replace(/-/g, ""),
                    endDate: endDate.toISOString().split("T")[0],
                    startDate: startDate.toISOString().split("T")[0],
                }
            );

            const data: Reservation[] = response.data;

            if (data.length === 0 && sessionId) {
                addHistoryLog({
                    sessionId,
                    page: "HistoryNone",
                    event: "navigate",
                    target_id: "history-search",
                    tag: "button",
                    text: "해당 기간 예매 내역 없음",
                    url: window.location.pathname,
                });
            }

            setFilteredReservations(data);
            setSelected([]);
            setHasSearched(true);
        } catch (error) {
            console.error("예매 내역 조회 실패:", error);
            alert("예매 내역을 불러오는 데 실패했습니다.");
        }
    };

    // [LLM] "선택항목 환불" 버튼 클릭 시 처리 → 환불 모달 열기 + 로그 기록
    const handleRefundClick = () => {
        const selectedRes = filteredReservations.filter((res) =>
            selected.includes(res.reservationId)
        );

        if (selectedRes.length === 0) {
            alert("환불할 항목을 선택해주세요!");
            return;
        }

        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "History",
                event: "click",
                target_id: "history-refund",
                tag: "button",
                text: "선택항목 환불 버튼 클릭",
            });
        }

        setIsModalOpen(true);
    };

    // [LLM] 환불 모달 내 "예" 클릭 시 → 로컬스토리지에서 예약 제거 후 환불 성공 페이지로 이동
    const confirmRefund = () => {
        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "RefundModalDetail",
                event: "click",
                target_id: "refundModalDetail-yes-to-RefundSuccess",
                tag: "button",
                text: "환불 모달창 - 예 클릭",
            });

            updateHistorySession({ end_reason: "refund_success" });
        }

        const keysToRemove: string[] = [];
        const keysToUpdate: { key: string; data: any[] }[] = [];
        const deleted: Reservation[] = [];

        selected.forEach((reservationId) => {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;

                try {
                    const raw = localStorage.getItem(key);
                    if (!raw) continue;

                    const data = JSON.parse(raw);
                    const items = Array.isArray(data) ? data : [data];

                    const updatedItems = items.filter(
                        (item: any) =>
                            item.id?.toString() !== reservationId.toString() &&
                            item.reservationId?.toString() !==
                                reservationId.toString()
                    );

                    if (Array.isArray(data)) {
                        if (updatedItems.length !== data.length) {
                            keysToUpdate.push({ key, data: updatedItems });
                        }
                    } else if (updatedItems.length === 0) {
                        keysToRemove.push(key);
                    }
                } catch {
                    continue;
                }
            }

            const res = filteredReservations.find(
                (r) => r.reservationId === reservationId
            );
            if (res) deleted.push(res);
        });

        keysToRemove.forEach((key) => localStorage.removeItem(key));
        keysToUpdate.forEach(({ key, data }) =>
            localStorage.setItem(key, JSON.stringify(data))
        );

        setIsModalOpen(false);
        setSelected([]);
        handleSearch();

        navigate("/history/refund-success", {
            state: { reservations: deleted },
        });
    };

    // [LLM] 환불 모달 내 "아니오" 클릭 시 → 모달 닫기 및 로그 기록
    const cancelRefund = () => {
        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "RefundModalDetail",
                event: "click",
                target_id: "refundModalDetail-no-to-History",
                tag: "button",
                text: "환불 모달창 - 아니오 클릭",
            });
        }
        setIsModalOpen(false);
    };

    // [LLM] 달력 날짜 클릭 시 로그 기록
    const handleCalendarClick = (value: Date) => {
        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "History",
                event: "click",
                target_id:
                    selectingDate === "start"
                        ? "calendar-start"
                        : "calendar-end",
                tag: "calendar",
                text: `날짜 선택: ${formatDate(value)}`,
            });
        }
    };

    // [LLM] '전체 선택' 체크박스 클릭 시 로그 기록
    const handleCheckboxToggle = (checked: boolean) => {
        if (sessionId && checked) {
            addHistoryLog({
                sessionId,
                page: "History",
                event: "click",
                target_id: "checkbox-all",
                tag: "checkbox",
                text: "체크박스 티켓 전체 선택",
            });
        }
    };

    return (
        // [LLM] 전체 페이지 컨테이너
        <div>
            {/* [LLM] 페이지 타이틀 (탭 제목) */}
            <title>history</title>

            {/* [LLM] 박스 스타일로 감싸는 메인 콘텐츠 */}
            <div className={styleb.box}>
                {/* [LLM] 사용자 식별자 포함 페이지 제목 */}
                <h3 className="page-title">
                    <span className="user-id">{maskedNumber}</span> 님의 예매
                    내역
                </h3>
                <hr className="page-title-bar" />

                {/* [LLM] 조회 기간 표시 및 날짜 선택 영역 */}
                <div className="date-section">
                    <span>조회 기간</span>
                    <span className="period">
                        {/* [LLM] 시작일 선택 버튼 */}
                        <span
                            className={`clickable ${
                                selectingDate === "start" ? "active" : ""
                            }`}
                            onClick={() => setSelectingDate("start")}
                        >
                            {formatDate(startDate)}
                        </span>{" "}
                        ~ {/* [LLM] 종료일 선택 버튼 */}
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

                {/* [LLM] 캘린더 컴포넌트 (react-calendar) */}
                <div className="calendar-wrapper">
                    <Calendar
                        onChange={(value) => {
                            if (value instanceof Date) {
                                handleCalendarClick(value);

                                if (selectingDate === "start") {
                                    setStartDate(value);
                                    if (value > endDate) setEndDate(value); // 시작일 > 종료일인 경우 종료일도 갱신
                                } else {
                                    setEndDate(
                                        value < startDate ? startDate : value
                                    ); // 종료일 < 시작일 방지
                                }
                            }
                        }}
                        value={selectingDate === "start" ? startDate : endDate}
                        selectRange={false}
                        minDate={
                            selectingDate === "start"
                                ? threeMonthsAgo
                                : undefined
                        }
                    />
                </div>

                {/* [LLM] 조회 버튼: 예매 내역 불러오기 */}
                <button
                    id="history-search"
                    className={`${styles.button} history-look-up`}
                    onClick={handleSearch}
                >
                    조회
                </button>

                {/* [LLM] 예매 내역 또는 조회 실패 시 메시지 */}
                <div className="history-ticket">
                    {hasSearched && filteredReservations.length === 0 ? (
                        // [LLM] 예매 내역이 없는 경우 보여지는 컴포넌트
                        <HistoryNone />
                    ) : (
                        <>
                            {/* [LLM] 예매 내역 헤더: 전체 선택 체크박스 포함 */}
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
                                            const isChecked = e.target.checked;
                                            handleCheckboxToggle(isChecked);
                                            setSelected(
                                                isChecked
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

                            {/* [LLM] 예매 티켓 리스트 영역 */}
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

                                {/* [LLM] 하나 이상 선택되었을 경우 환불 버튼 표시 */}
                                {filteredReservations.length > 0 && (
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

                {/* [LLM] 환불 확인 모달이 열렸을 때만 표시 */}
                {isModalOpen && (
                    <RefundModalDetail
                        onConfirm={confirmRefund}
                        onCancel={cancelRefund}
                    />
                )}
            </div>
        </div>
    );
};

export default History;
