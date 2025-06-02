// [LLM] 기차 예매를 위한 페이지입니다. 출발역, 도착역, 날짜, 인원을 선택할 수 있습니다.

import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styleb from "../styles/Box.module.css";
import "../styles/Reservation.css";
import StationSelector from "./StationSelector";
import styles from "../styles/Button.module.css";
import {
    updateCurrentSession,
    addReservationLog,
    updateReservationLogSession,
} from "../utils/session";
import axios from "axios";

// [LLM] 선택 가능한 역 리스트
const stations = [
    "선택",
    "서울",
    "광명",
    "수원",
    "천안",
    "오송",
    "대전",
    "마산",
    "밀양",
    "구포",
    "평창",
    "강릉",
    "전주",
    "목포",
    "여수",
    "용산",
    "원주",
    "평택",
    "안동",
    "서산",
    "진주",
    "대구",
    "동해",
    "진부",
    "익산",
    "부산",
    "순천",
    "울산",
    "창원",
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
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // [LLM] 페이지 진입 시 세션 ID 확인 및 로그 기록
    useEffect(() => {
        const raw = localStorage.getItem("currentReservationLogSession");
        if (!raw) return;
        const session = JSON.parse(raw);
        const sid = session?.sessionId;
        if (!sid) return;
        setSessionId(sid);

        updateReservationLogSession({
            sessionId: sid,
            current_page: "Reservation",
        });

        const alreadyLogged = session.logs?.some(
            (log: any) =>
                log.page === "Reservation" &&
                log.event === "navigate" &&
                log.target_id === "page-load"
        );

        if (!alreadyLogged) {
            addReservationLog({
                sessionId: sid,
                page: "Reservation",
                event: "navigate",
                target_id: "page-load",
                tag: "system",
                text: "Reservation 페이지 도착",
            });
        }
    }, []);

    // [LLM] 클릭 이벤트 로깅 함수
    const logClick = (target_id: string, text: string, tag = "button") => {
        if (!sessionId) return;
        addReservationLog({
            sessionId,
            page: "Reservation",
            event: "click",
            target_id,
            tag,
            text,
        });
    };

    // [LLM] 처음 시작할 때 상태 초기화 여부 확인 (reset 여부)
    useEffect(() => {
        const shouldReset = location.state?.reset === true;
        if (shouldReset) {
            localStorage.removeItem(STORAGE_KEY);
            setReservationData({
                departureStation: null,
                destinationStation: null,
                departureDate: null,
                adultCount: 0,
                seniorCount: 0,
                teenCount: 0,
            });
        }
    }, []);

    const loadStoredData = () => {
        const storedData = localStorage.getItem(STORAGE_KEY);
        return storedData ? JSON.parse(storedData) : null;
    };

    // [LLM] 예약 데이터 상태 초기화
    const [reservationData, setReservationData] = useState<ReservationData>(
        () => {
            const stored = loadStoredData();
            return {
                departureStation: stored?.departureStation || null,
                destinationStation: stored?.destinationStation || null,
                departureDate: stored?.departureDate
                    ? new Date(stored.departureDate)
                    : null,
                adultCount: stored?.adultCount ?? 0,
                seniorCount: stored?.seniorCount ?? 0,
                teenCount: stored?.teenCount ?? 0,
            };
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

    // [LLM] 역 선택 모달 상태
    const [showStationSelector, setShowStationSelector] = useState<
        "departure" | "arrival" | null
    >(null);

    // [LLM] 예약 데이터를 localStorage에 저장
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reservationData));
    }, [reservationData]);

    // [LLM] 역 선택 외부 클릭 시 팝업 닫기
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

    // [LLM] 역 선택 핸들러
    const handleStationChange = (
        type: "departure" | "arrival",
        value: string
    ) => {
        const id =
            type === "departure"
                ? "select-departure-station"
                : "select-arrival-station";
        logClick(
            id,
            `${type === "departure" ? "출발역" : "도착역"} 선택: ${value}`
        );
        setReservationData((prev) => ({
            ...prev,
            [type === "departure" ? "departureStation" : "destinationStation"]:
                value,
        }));
    };
    // [LLM] 날짜 선택 핸들러
    const handleDateChange = (value: Date | Date[] | null) => {
        const dateValue =
            value instanceof Date
                ? value
                : Array.isArray(value)
                ? value[0]
                : null;
        if (dateValue) {
            logClick(
                "calendar-tile",
                `날짜 선택: ${dateValue.toLocaleDateString()}`,
                "tile"
            );
        }
        setReservationData((prev) => ({
            ...prev,
            departureDate: dateValue,
        }));
    };

    // [LLM] 인원 수 증감 핸들러
    const handleCountChange = (
        type: "adultCount" | "seniorCount" | "teenCount",
        delta: number
    ) => {
        const id = `${delta > 0 ? "increase" : "decrease"}-${type.replace(
            "Count",
            ""
        )}`;
        const labelMap = {
            adultCount: "성인",
            seniorCount: "노약자",
            teenCount: "청소년",
        };
        logClick(id, `${labelMap[type]} 수 ${delta > 0 ? "증가" : "감소"}`);
        setReservationData((prev) => ({
            ...prev,
            [type]: Math.max(0, prev[type] + delta),
        }));
    };

    // [LLM] 홈으로 돌아가기
    const handleBack = () => {
        logClick("reservation-to-home", "이전");
        navigate("/");
    };

    // [LLM] 기차 조회 버튼 클릭 시 처리
    const handleSearch = async () => {
        logClick("reservation-to-trainlist", "조회");
        if (!departureStation) return alert("출발역은 필수입니다.");
        if (!destinationStation) return alert("도착역은 필수입니다.");
        if (!departureDate) return alert("날짜는 필수입니다.");
        if (departureStation === destinationStation)
            return alert("출발역과 도착역은 서로 달라야 합니다.");
        if (adultCount + seniorCount + teenCount < 1)
            return alert("최소 1명 이상의 인원이 필요합니다.");

        const dateObj = new Date(departureDate);
        dateObj.setHours(dateObj.getHours() + 9); // UTC → KST
        const formattedDate = dateObj.toISOString().split("T")[0];

        try {
            const response = await axios.get("http://localhost:3000/trains", {
                params: {
                    departure: departureStation,
                    destination: destinationStation,
                    date: formattedDate,
                },
            });

            const trainList = response.data.trains;
            updateCurrentSession({ reservationData });
            navigate("/reservation/train-list", {
                state: { ...reservationData, trainList },
            });
        } catch (error) {
            console.error("열차 정보 불러오기 실패:", error);
            alert("열차 정보를 불러오는 데 실패했습니다.");
        }
    };

    return (
        <div>
            {/* [LLM] 예약 정보 입력을 위한 전체 박스 컨테이너 */}
            <div className={styleb.box} style={{ position: "relative" }}>
                <h2 className="page-title">승차권 예매</h2>
                <hr className="page-title-bar" />

                <div className="content-container">
                    {/* [LLM] 출발역 및 도착역 선택 UI */}
                    <div className="station-box">
                        {/* [LLM] 출발역 버튼 */}
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
                                id="select-departure-station"
                            >
                                {departureStation ?? "출발역"}
                                <img
                                    src="src/assets/down-arrow.svg"
                                    alt="화살표"
                                    className="dropdown-arrow-icon"
                                />
                            </button>
                        </div>

                        <div className="station-selection-arrow">→</div>

                        {/* [LLM] 도착역 버튼 */}
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
                                id="select-arrival-station"
                            >
                                {destinationStation ?? "도착역"}
                                <img
                                    src="src/assets/down-arrow.svg"
                                    alt="화살표"
                                    className="dropdown-arrow-icon"
                                />
                            </button>
                        </div>
                    </div>

                    {/* [LLM] 역 선택 팝업 모달 */}
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

                    {/* [LLM] 날짜 선택 UI */}
                    <div>
                        <h4 className="reservation-detail-select">
                            <p className="reservation-detail-select-inform">
                                출발일
                            </p>
                            {departureDate
                                ? new Date(departureDate).toLocaleDateString()
                                : "날짜를 선택해주세요."}
                        </h4>
                        <div id="calendar-wrapper">
                            <Calendar
                                calendarType="gregory"
                                onChange={(value) =>
                                    handleDateChange(
                                        value as Date | Date[] | null
                                    )
                                }
                                value={
                                    departureDate
                                        ? new Date(departureDate)
                                        : null
                                }
                                selectRange={false}
                                minDate={new Date()}
                                tileClassName={({ date: tileDate }) => {
                                    const isSelected =
                                        departureDate &&
                                        tileDate.toDateString() ===
                                            new Date(
                                                departureDate
                                            ).toDateString();

                                    return isSelected ? "selected-date" : "";
                                }}
                            />
                        </div>
                    </div>

                    {/* [LLM] 인원 수 선택 UI */}
                    <div>
                        <h4 className="reservation-detail-select">
                            <p className="reservation-detail-select-inform">
                                인원 선택
                            </p>
                            <span>
                                성인 {adultCount}명, 노약자 {seniorCount}명,
                                청소년 {teenCount}명
                            </span>
                        </h4>
                        <div className="select-people-number">
                            {/* [LLM] 성인 수 조절 */}
                            <div>
                                <div className="select-people-number-button">
                                    성인<br></br>(만 19세 이상)
                                </div>
                                <div className="select-people-number-button">
                                    <button
                                        onClick={() =>
                                            handleCountChange("adultCount", -1)
                                        }
                                        id="decrease-adult"
                                    >
                                        -
                                    </button>
                                    <span>{adultCount}</span>
                                    <button
                                        onClick={() =>
                                            handleCountChange("adultCount", 1)
                                        }
                                        id="increase-adult"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            {/* [LLM] 노약자 수 조절 */}
                            <div>
                                <div className="select-people-number-button">
                                    노약자<br></br>(만 65세 이상)
                                </div>
                                <div className="select-people-number-button">
                                    <button
                                        onClick={() =>
                                            handleCountChange("seniorCount", -1)
                                        }
                                        id="decrease-senior"
                                    >
                                        -
                                    </button>
                                    <span>{seniorCount}</span>
                                    <button
                                        onClick={() =>
                                            handleCountChange("seniorCount", 1)
                                        }
                                        id="increase-senior"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            {/* [LLM] 청소년 수 조절 */}
                            <div>
                                <div className="select-people-number-button">
                                    청소년<br></br>(만 13~18세)
                                </div>
                                <div className="select-people-number-button">
                                    <button
                                        onClick={() =>
                                            handleCountChange("teenCount", -1)
                                        }
                                        id="decrease-teen"
                                    >
                                        -
                                    </button>
                                    <span>{teenCount}</span>
                                    <button
                                        onClick={() =>
                                            handleCountChange("teenCount", 1)
                                        }
                                        id="increase-teen"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* [LLM] 하단 버튼: 이전/조회 */}
            <div className="display-button">
                <button
                    className={`${styles.button} reservation-back`}
                    id="reservation-to-home"
                    onClick={handleBack}
                >
                    이전
                </button>
                <button
                    className={`${styles.button} reservation-search`}
                    id="reservation-to-trainlist"
                    onClick={handleSearch}
                >
                    조회
                </button>
            </div>
        </div>
    );
};

export default Reservation;