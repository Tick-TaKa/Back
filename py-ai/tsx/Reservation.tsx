import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styleb from "../styles/Box.module.css";
import "../styles/Reservation.css";
import StationSelector from "./StationSelector";
import styles from "../styles/Button.module.css";

const stations = [
    "선택",
    "서울",
    "광명",
    "수원",
    "천안아산",
    "오송",
    "대전",
    "마산",
    "밀양",
    "구포",
    "평창",
    "강릉",
    "전주",
    "목포",
    "청량리",
    "용산",
    "원주",
    "평택",
    "천안",
    "조치원",
    "서대전",
    "대구",
    "동해",
    "진부",
    "익산",
    "부산",
    "순천",
    "울산",
    "정동진",
];

interface ReservationData {
    departureStation: string | null;
    destinationStation: string | null;
    departureDate: Date | null;
    adultCount: number;
    seniorCount: number;
    teenCount: number;
}

const STORAGE_KEY = "reservationData";

const Reservation = () => {
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadStoredData = () => {
        const storedData = localStorage.getItem(STORAGE_KEY);
        return storedData ? JSON.parse(storedData) : null;
    };

    const [reservationData, setReservationData] = useState<ReservationData>(
        () => {
            return (
                loadStoredData() || {
                    departureStation: null,
                    destinationStation: null,
                    departureDate: null,
                    adultCount: 0,
                    seniorCount: 0,
                    teenCount: 0,
                }
            );
        }
    );

    const {
        departureStation,
        destinationStation,
        departureDate,
        adultCount,
        seniorCount,
        teenCount,
    } = reservationData;
    const [showStationSelector, setShowStationSelector] = useState<
        "departure" | "arrival" | null
    >(null);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reservationData));
    }, [reservationData]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setShowStationSelector(null);
            }
        };
        if (showStationSelector) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showStationSelector]);

    const handleStationChange = (
        type: "departure" | "arrival",
        value: string
    ) => {
        setReservationData((prev) => ({
            ...prev,
            [type === "departure" ? "departureStation" : "destinationStation"]:
                value,
        }));
    };

    const handleDateChange = (value: Date | Date[] | null) => {
        setReservationData((prev) => ({
            ...prev,
            departureDate: value instanceof Date ? value : value?.[0] || null,
        }));
    };

    const handleCountChange = (
        type: "adultCount" | "seniorCount" | "teenCount",
        delta: number
    ) => {
        setReservationData((prev) => ({
            ...prev,
            [type]: Math.max(0, prev[type] + delta),
        }));
    };

    const handleSearch = () => {
        if (!departureStation) return alert("출발역은 필수입니다.");
        if (!destinationStation) return alert("도착역은 필수입니다.");
        if (!departureDate) return alert("날짜는 필수입니다.");
        if (adultCount + seniorCount + teenCount < 1)
            return alert("최소 1명 이상의 인원이 필요합니다.");

        navigate("/reservation/train-list", { state: reservationData });
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div>
            <div className={styleb.box} style={{ position: "relative" }}>
                <title>Reservation</title>
                {/*[LLM] 페이지 제목입니다. 사용자가 기차표 예매를 시작하는 화면입니다.*/}
                <h2 className="page-title">승차권 예매</h2> 
                <hr className="page-title-bar" />

                <div className="content-container">
                    <div className="station-box">
                        <div className="station-selection">
                            <div className="depature-station">출발</div>
                            <button
                                onClick={() =>
                                    setShowStationSelector(
                                        showStationSelector === "departure"
                                            ? null
                                            : "departure"
                                    )
                                }
                                className="station-select-button"
                            >
                                {/*[LLM] 출발역을 선택하는 버튼입니다.*/}
                                {departureStation ?? "출발역"} 
                                <img src="src/assets/down-arrow.svg" alt="화살표" className="dropdown-arrow-icon" />
                            </button>
                        </div>

                        <div className="station-selection">
                            <div className="arrival-station">도착</div>
                            <button
                                onClick={() =>
                                    setShowStationSelector(
                                        showStationSelector === "arrival"
                                            ? null
                                            : "arrival"
                                    )
                                }
                                className="station-select-button"
                            >
                                 {/*[LLM] 도착역을 선택하는 버튼입니다.*/}
                                {destinationStation ?? "도착역"}
                                <img src="src/assets/down-arrow.svg" alt="화살표" className="dropdown-arrow-icon" />
                            </button>
                        </div>
                    </div>

                    {showStationSelector && (
                        <div
                            ref={dropdownRef}
                            style={{
                                position: "fixed",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                zIndex: 1000,
                                backgroundColor: "white",
                                borderRadius: "16px",
                                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
                            }}
                        >
                            <StationSelector
                                stations={stations.slice(1)}
                                onSelect={(station) => {
                                    handleStationChange(
                                        showStationSelector,
                                        station
                                    );
                                    setShowStationSelector(null);
                                }}
                            />
                        </div>
                    )}

                    <div>
                        <h4>
                            출발일<br></br>
                            {departureDate
                                ? new Date(departureDate).toLocaleDateString()
                                : "날짜를 선택해주세요."}
                        </h4>
                        {/*[LLM] 사용자가 기차 출발일을 선택하는 캘린더 컴포넌트입니다.*/}
                    <Calendar
                            calendarType="gregory"
                            onChange={(value) =>
                                handleDateChange(value as Date | Date[] | null)
                            }
                            value={
                                departureDate ? new Date(departureDate) : null
                            }
                            selectRange={false}
                            minDate={new Date()} // 지나간 날 막기
                            tileClassName={({ date: tileDate }) =>
                                departureDate &&
                                tileDate.toDateString() ===
                                    new Date(departureDate).toDateString()
                                    ? "selected-date"
                                    : ""
                            }
                        />
                    </div>

                    <div>
                        <h4>
                            인원 선택
                            <br />
                            <span style={{ fontWeight: 400 }}>
                                성인 {adultCount}명, 노약자 {seniorCount}명,
                                청소년 {teenCount}명
                            </span>
                        </h4>
                        <div className="select-people-number">
                            <div>
                                <div>
                                    성인<br></br>(만 19세 이상)
                                </div>
                                <button
                                    onClick={() =>
                                        handleCountChange("adultCount", -1)
                                    }
                                >
                                    -
                                </button>
                                <span>{adultCount}</span>
                                <button
                                    onClick={() =>
                                        handleCountChange("adultCount", 1)
                                    }
                                >
                                    +
                                </button>
                            </div>
                            <div>
                                <div>
                                    노약자<br></br>(만 65세 이상)
                                </div>
                                <button
                                    onClick={() =>
                                        handleCountChange("seniorCount", -1)
                                    }
                                >
                                    -
                                </button>
                                <span>{seniorCount}</span>
                                <button
                                    onClick={() =>
                                        handleCountChange("seniorCount", 1)
                                    }
                                >
                                    +
                                </button>
                            </div>
                            <div>
                                <div>
                                    청소년<br></br>(만 13~18세)
                                </div>
                                <button
                                    onClick={() =>
                                        handleCountChange("teenCount", -1)
                                    }
                                >
                                    -
                                </button>
                                <span>{teenCount}</span>
                                <button
                                    onClick={() =>
                                        handleCountChange("teenCount", 1)
                                    }
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="display-button">
                <button
                    className={`${styles.button} reservation-back`}
                    onClick={handleBack}
                >
                    이전
                </button>
                <button
                    className={`${styles.button} reservation-search`}
                    onClick={handleSearch}
                >
                    조회
                </button>
            </div>
        </div>
    );
};

export default Reservation;

// 예매가 모두 끝나고 다시 예매 화면으로 돌아오면 그 데이터는 로컬에 담아두고 다시 새로운 데이터를 받기 위해 초기화된 상태로 다시 화면이 로드되게 만들기
