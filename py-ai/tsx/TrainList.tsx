// [LLM] 사용자가 기차를 선택하는 TrainList 페이지입니다.
// 선택 가능한 기차 목록을 표시하고, 좌석 선택 페이지로 이동할 수 있습니다.

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styleb from "../styles/Box.module.css";
import styles from "../styles/Button.module.css";
import "../styles/TrainList.css";
import {
    updateCurrentSession,
    addReservationLog,
    updateReservationLogSession,
} from "../utils/session";
import axios from "axios";

// [LLM] 예약 데이터 타입 정의
interface ReservationData {
    departureStation: string | null;
    destinationStation: string | null;
    departureDate: Date | null;
    adultCount: number;
    seniorCount: number;
    teenCount: number;
}

// [LLM] 기차 정보 타입 정의
interface Train {
    trainId: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    availableSeats: number;
}

const TrainList = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // [LLM] 이전 페이지에서 전달된 예약 데이터를 가져옵니다.
    const reservationData = location.state as ReservationData;

    // [LLM] 선택된 기차 정보와 기차 목록 상태 정의
    const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
    const [trains, setTrains] = useState<Train[]>([]);

    // [LLM] 현재 세션 ID를 localStorage에서 가져옵니다.
    const sessionId = (() => {
        try {
            return JSON.parse(localStorage.getItem("currentReservationLogSession") || "null")?.sessionId;
        } catch {
            return null;
        }
    })();

    // [LLM] 공통 클릭 로그 기록 함수
    const logClick = (target_id: string, text: string, tag = "button") => {
        if (!sessionId) return;
        addReservationLog({
            sessionId,
            page: "TrainList",
            event: "click",
            target_id,
            tag,
            text,
        });
    };

    // [LLM] 페이지 진입 시 로그 기록 및 세션 위치 업데이트
    useEffect(() => {
        if (sessionId) {
            updateReservationLogSession({
                location: "TrainList",
                previous_pages: ["Reservation"],
            });

            const sessionRaw = localStorage.getItem("currentReservationLogSession");
            if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                const alreadyLogged = session.logs?.some(
                    (log: any) =>
                        log.page === "TrainList" &&
                        log.event === "navigate" &&
                        log.target_id === "page-load"
                );

                if (!alreadyLogged) {
                    addReservationLog({
                        sessionId,
                        page: "TrainList",
                        event: "navigate",
                        target_id: "page-load",
                        tag: "system",
                        text: "TrainList 페이지 도착",
                    });
                }
            }
        }
    }, [sessionId]);

    // [LLM] 기차 목록 API 요청 및 상태 설정
    useEffect(() => {
        const fetchTrains = async () => {
            try {
                if (
                    !reservationData?.departureStation ||
                    !reservationData?.destinationStation ||
                    !reservationData?.departureDate
                ) {
                    console.warn("필수 정보 누락");
                    return;
                }

                // [LLM] 날짜를 KST 기준 문자열로 변환
                const departureDate = new Date(reservationData.departureDate);
                const kstOffset = 9 * 60 * 60 * 1000;
                const kstDate = new Date(departureDate.getTime() + kstOffset);
                const dateStr = kstDate.toISOString().split("T")[0];

                const response = await axios.get("http://localhost:3000/trains", {
                    params: {
                        departure: reservationData.departureStation,
                        destination: reservationData.destinationStation,
                        date: dateStr,
                    },
                });

                if (response.data?.trains) {
                    setTrains(response.data.trains);
                } else {
                    console.warn("trains 데이터가 없음");
                }
            } catch (err) {
                console.error("기차 정보 요청 실패:", err);
            }
        };

        fetchTrains();
    }, [reservationData]);

    // [LLM] 이전 버튼 클릭 시 예약 정보 입력 페이지로 이동
    const handleBack = () => {
        logClick("trainlist-to-reservation", "이전");
        navigate("/reservation");
    };

    // [LLM] 기차 선택 시 상태 업데이트 및 로그 기록
    const handleSelect = (train: Train) => {
        if (train.availableSeats === 0) return; // [LLM] 좌석이 없으면 선택 불가
        setSelectedTrain(train);
        logClick(`select-trainlist-${train.trainId}`, `${train.trainId} 선택`, "tr");
    };

    // [LLM] 다음 버튼 클릭 시 좌석 선택 페이지로 이동
    const handleNext = () => {
        logClick("trainlist-to-selectseat", "다음");

        if (!selectedTrain) {
            alert("기차를 선택해주세요.");
            return;
        }

        updateCurrentSession({ trainInfo: selectedTrain });

        navigate("/reservation/select-seat", {
            state: {
                reservationData,
                trainInfo: selectedTrain,
            },
        });
    };

    // [LLM] 기차 ID 확인용 콘솔 로그
    useEffect(() => {
        console.log("trainIds", trains.map((t) => t.trainId));
    }, [trains]);

    return (
        <div>
            {/* [LLM] 기차 리스트 상단 박스 */}
            <div className={styleb.box}>
                <h2 className="page-title">시간대 선택</h2>
                <hr className="page-title-bar" />

                {/* [LLM] 기차 정보 테이블 */}
                <div className="content-container">
                    <table style={{ borderCollapse: "collapse", width: "100%" }}>
                        <thead>
                            <tr>
                                <th>출발</th>
                                <th>도착</th>
                                <th>가격</th>
                                <th>남은 <br />좌석 수</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trains.map((train) => (
                                // [LLM] 기차 한 줄을 클릭 시 선택됨. 이미 선택된 기차는 배경색 강조.
                                <tr
                                    key={train.trainId}
                                    id={`select-trainlist-${train.trainId}`}
                                    onClick={() => handleSelect(train)}
                                    style={{
                                        opacity: train.availableSeats === 0 ? 0.3 : 1,
                                        backgroundColor:
                                            train.trainId === selectedTrain?.trainId
                                                ? "#E3F2FD"
                                                : "transparent",
                                        cursor: train.availableSeats === 0 ? "not-allowed" : "pointer",
                                        transition: "0.3s ease-in-out",
                                        borderRadius: "8px",
                                    }}
                                    className={
                                        train.trainId === selectedTrain?.trainId ? "selected-row" : ""
                                    }
                                >
                                    <td>{train.departureTime}</td>
                                    <td>{train.arrivalTime}</td>
                                    <td>{train.price.toLocaleString()}원</td>
                                    <td
                                        style={{
                                            color: train.availableSeats <= 15 ? "#FF1744" : "#111111",
                                        }}
                                    >
                                        {train.availableSeats}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* [LLM] 하단 이동 버튼: 이전, 다음 */}
            <div className="display-button">
                <button
                    className={`${styles.button} train-list-back`}
                    id="trainlist-to-reservation"
                    onClick={handleBack}
                >
                    이전
                </button>
                <button
                    className={`${styles.button} train-list-search`}
                    id="trainlist-to-selectseat"
                    onClick={handleNext}
                >
                    다음
                </button>
            </div>
        </div>
    );
};

export default TrainList;