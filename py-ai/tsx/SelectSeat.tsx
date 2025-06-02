// [LLM] 좌석 선택 페이지입니다. 사용자가 기차 좌석을 선택할 수 있습니다.
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styleb from "../styles/Box.module.css";
import seatImage from "../assets/seat-button.svg";
import trainConvenience from "../assets/train-convenience.svg";
import trainaisle from "../assets/train-track-single.svg";
import "../styles/SelectSeat.css";
import styles from "../styles/Button.module.css";
import {
    updateCurrentSession,
    addReservationLog,
    updateReservationLogSession,
} from "../utils/session";
import axios from "axios";

interface Seat {
    seatNumber: string;
    isAvailable: boolean;
}

// [LLM] 좌석 선택 페이지 컴포넌트입니다.
const SelectSeat = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // [LLM] 이전 페이지로부터 전달된 예약 정보와 기차 정보를 가져옵니다.
    const state = location.state || {};
    const reservationData = state.reservationData;
    const trainInfo = state.trainInfo;

    // [LLM] 총 승객 수 계산 (성인 + 청소년 + 경로)
    const totalPassengers = reservationData
        ? reservationData.adultCount + reservationData.seniorCount + reservationData.teenCount
        : 0;

    // [LLM] 현재 선택된 호차 번호
    const [carriageNumber, setCarriageNumber] = useState<number>(1);

    // [LLM] 전체 호차에 대한 좌석 정보 맵
    const [seatMap, setSeatMap] = useState<Record<number, Seat[]>>({});

    // [LLM] 전체 호차에 대한 선택된 좌석 정보
    const [allSelectedSeats, setAllSelectedSeats] = useState<Record<number, string[]>>({});

    // [LLM] 현재 호차의 선택된 좌석 및 가능한 좌석 리스트
    const selectedSeats = allSelectedSeats[carriageNumber] || [];
    const availableSeats = seatMap[carriageNumber] || [];

    // [LLM] 현재 세션 ID를 localStorage에서 불러옵니다.
    const sessionId = (() => {
        try {
            return JSON.parse(localStorage.getItem("currentReservationLogSession") || "null")?.sessionId;
        } catch {
            return null;
        }
    })();

    // [LLM] 페이지 진입 시 세션 위치 업데이트 및 로그 기록
    useEffect(() => {
        if (sessionId) {
            updateReservationLogSession({
                location: "SelectSeat",
                previous_pages: ["TrainList"],
            });

            const sessionRaw = localStorage.getItem("currentReservationLogSession");
            if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                const alreadyLogged = session.logs?.some(
                    (log: any) =>
                        log.page === "SelectSeat" &&
                        log.event === "navigate" &&
                        log.target_id === "page-load"
                );

                if (!alreadyLogged) {
                    // [LLM] 페이지 도착 로그 기록
                    addReservationLog({
                        sessionId,
                        page: "SelectSeat",
                        event: "navigate",
                        target_id: "page-load",
                        tag: "system",
                        text: "SelectSeat 페이지 도착",
                    });
                }
            }
        }
    }, [sessionId]);

    // [LLM] 공통 클릭 로그 기록 함수
    const logClick = (target_id: string, text: string, tag = "button") => {
        if (!sessionId) return;
        addReservationLog({
            sessionId,
            page: "SelectSeat",
            event: "click",
            target_id,
            tag,
            text,
        });
    };

    // [LLM] 좌석 정보 불러오기 (1~3호차)
    useEffect(() => {
        const fetchSeats = async () => {
            if (!trainInfo?.trainId) return;

            const newMap: Record<number, Seat[]> = {};
            for (let i = 1; i <= 3; i++) {
                try {
                    const res = await axios.get(`http://localhost:3000/seats/${trainInfo.trainId}/${i}`);
                    newMap[i] = res.data?.availableSeats || [];
                } catch (err) {
                    console.error(`호차 ${i} 좌석 정보를 불러오지 못했습니다:`, err);
                    newMap[i] = [];
                }
            }
            setSeatMap(newMap);
        };

        fetchSeats();
    }, [trainInfo]);

    // [LLM] 선택 좌석 정보를 세션에 실시간 저장
    useEffect(() => {
        updateCurrentSession({ selectedSeats: allSelectedSeats });
    }, [allSelectedSeats]);

    // [LLM] 좌석 선택/해제 처리 함수
    const toggleSeat = (seatNumber: string) => {
        setAllSelectedSeats((prev) => {
            const totalSelected = Object.values(prev).flat().length;
            const current = prev[carriageNumber] || [];

            if (current.includes(seatNumber)) {
                logClick(`seat-${carriageNumber}-${seatNumber}`, `좌석 해제: ${carriageNumber}호차 ${seatNumber}`);
                return {
                    ...prev,
                    [carriageNumber]: current.filter((s) => s !== seatNumber),
                };
            } else if (totalSelected < totalPassengers) {
                logClick(`seat-${carriageNumber}-${seatNumber}`, `좌석 선택: ${carriageNumber}호차 ${seatNumber}`);
                return {
                    ...prev,
                    [carriageNumber]: [...current, seatNumber],
                };
            } else {
                alert(`총 ${totalPassengers}개의 좌석만 선택할 수 있습니다.`);
                return prev;
            }
        });
    };

    // [LLM] 좌석 제거 버튼 클릭 시 호출
    const handleDelete = (carNum: number, seat: string) => {
        logClick(`delete-seat-${carNum}-${seat}`, `좌석 제거: ${carNum}호차 ${seat}`);
        setAllSelectedSeats((prev) => ({
            ...prev,
            [carNum]: prev[carNum].filter((s) => s !== seat),
        }));
    };

    // [LLM] 다음 버튼 클릭 시 결제 페이지로 이동
    const handleNext = () => {
        logClick("selectseat-to-payment", "다음");
        const totalSelected = Object.values(allSelectedSeats).flat().length;
        if (totalSelected < totalPassengers) {
            alert(`총 ${totalPassengers}개의 좌석을 선택해야 합니다.`);
            return;
        }
        navigate("/reservation/payment", {
            state: {
                reservationData,
                trainInfo,
                selectedSeats: allSelectedSeats,
            },
        });
    };

    // [LLM] 이전 버튼 클릭 시 기차 선택 페이지로 이동
    const handleBack = () => {
        logClick("selectseat-to-trainlist", "이전");
        navigate("/reservation/train-list", {
            state: {
                reservationData,
            },
        });
    };

    return (
        <div>
            {/* [LLM] 좌석 선택 상단 박스 */}
            <div className={styleb.box}>
                <div className="seat-container">
                    <h2 className="page-title">좌석 선택</h2>
                    <hr className="page-title-bar" />

                    {reservationData && trainInfo ? (
                        <div className="content-container">
                            {/* [LLM] 호차 선택 드롭다운 */}
                            <div className="carriage-selection">
                                <select
                                    id="carriage"
                                    value={carriageNumber}
                                    onChange={(e) => {
                                        const selected = Number(e.target.value);
                                        logClick(`carriage-select-${selected}`, `${selected}호차 선택`);
                                        setCarriageNumber(selected);
                                    }}
                                >
                                    <option value={1}>1호차</option>
                                    <option value={2}>2호차</option>
                                    <option value={3}>3호차</option>
                                </select>
                            </div>

                            {/* [LLM] 기차 편의 시설 이미지 */}
                            <div className="train-convenience-box">
                                <img className="train-convenience-img" src={trainConvenience} alt="기차 편의 시설" />
                            </div>

                            {/* [LLM] 좌석 격자 그리드 */}
                            <div className="seat-grid">
                                {/* [LLM] 좌석 안내 텍스트 */}
                                <div className="seat-guide">
                                    <div>창측</div>
                                    <div>내측</div>
                                    <div></div>
                                    <div>내측</div>
                                    <div>창측</div>
                                </div>

                                {/* [LLM] 4줄 × 4열(A-D) 좌석 버튼 렌더링 */}
                                {[1, 2, 3, 4].map((row) => (
                                    <React.Fragment key={row}>
                                        {["A", "B"].map((col) => {
                                            const seat = availableSeats.find((s) => s.seatNumber === `${row}${col}`);
                                            return seat && (
                                                <button
                                                    key={seat.seatNumber}
                                                    className={`seat ${selectedSeats.includes(seat.seatNumber) ? "selected" : ""}`}
                                                    onClick={() => seat.isAvailable && toggleSeat(seat.seatNumber)}
                                                    disabled={!seat.isAvailable}
                                                >
                                                    <img
                                                        src={seatImage}
                                                        alt="Seat"
                                                        className={`seat-icon ${!seat.isAvailable ? "disabled" : ""}`}
                                                    />
                                                    <div className="seat-number">{seat.seatNumber}</div>
                                                </button>
                                            );
                                        })}
                                        <div className="train-aisle">
                                            <img src={trainaisle} alt="기차 통로 이미지" />
                                        </div>
                                        {["C", "D"].map((col) => {
                                            const seat = availableSeats.find((s) => s.seatNumber === `${row}${col}`);
                                            return seat && (
                                                <button
                                                    key={seat.seatNumber}
                                                    className={`seat ${selectedSeats.includes(seat.seatNumber) ? "selected" : ""}`}
                                                    onClick={() => seat.isAvailable && toggleSeat(seat.seatNumber)}
                                                    disabled={!seat.isAvailable}
                                                >
                                                    <img
                                                        src={seatImage}
                                                        alt="Seat"
                                                        className={`seat-icon ${!seat.isAvailable ? "disabled" : ""}`}
                                                    />
                                                    <div className="seat-number">{seat.seatNumber}</div>
                                                </button>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* [LLM] 선택된 좌석 리스트 표시 및 제거 버튼 */}
                            <div className="selected-seats">
                                <h4>선택한 좌석: </h4>
                                {Object.entries(allSelectedSeats).flatMap(([carNum, seats]) =>
                                    seats.map((seat) => (
                                        <span key={`${carNum}-${seat}`} className="selected-seat">
                                            {carNum}호차 - {seat}
                                            <button
                                                id="selected-seats-delete"
                                                onClick={() => handleDelete(Number(carNum), seat)}
                                            >
                                                X
                                            </button>
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        // [LLM] 기차 정보 없음 안내
                        <div style={{ padding: "2rem", textAlign: "center" }}>
                            <p>기차 정보가 없어 좌석 정보를 표시할 수 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* [LLM] 페이지 하단 버튼: 이전/다음 */}
            <div className="display-button">
                <button className={`${styles.button} select-seat-back`} id="selectseat-to-trainlist" onClick={handleBack}>
                    이전
                </button>
                <button className={`${styles.button} select-seat-next`} id="selectseat-to-payment" onClick={handleNext}>
                    다음
                </button>
            </div>
        </div>
    );
};

export default SelectSeat;