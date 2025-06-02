import { useNavigate } from "react-router-dom";
import logoMain from "../assets/lolgo_main.svg";
import styles from "../styles/Button.module.css";
import "../styles/Start.css";
import {
    addReservationLog,
    addHistoryLog, // [LLM] 예매/조회 시 로그를 기록하는 함수입니다.
} from "../utils/session";
import axios from "axios";

const Start = () => {
    const navigate = useNavigate();

    // [LLM] 예매 버튼 클릭 시 예약용 세션을 생성하고 예약 페이지로 이동합니다.
    const handleStartReservation = async () => {
        let backendSessionId: string | null = null;

        try {
            // [LLM] 백엔드에 세션 생성 요청을 보냅니다. 목적은 "reservation", 현재 페이지는 "Start"입니다.
            const response = await axios.post(
                "http://localhost:3000/sessions/start",
                {
                    purpose: "reservation",
                    current_page: "Start",
                }
            );

            const sessionData = response.data;
            backendSessionId = sessionData.sessionId;

            if (backendSessionId) {
                // [LLM] 백엔드에서 받은 sessionId를 이용해 새 세션 객체를 생성합니다.
                const newSession = {
                    sessionId: backendSessionId,
                    status: "active",
                    purpose: "reservation",
                    current_page: "start",
                    start_time: new Date().toISOString(),
                    last_interaction: new Date().toISOString(),
                    previous_pages: [],
                    logs: [],
                };

                // [LLM] 현재 예약 세션을 localStorage에 저장합니다.
                localStorage.setItem(
                    "currentReservationLogSession",
                    JSON.stringify(newSession)
                );

                // [LLM] 전체 예약 세션 리스트에 현재 세션을 추가합니다.
                const allSessions = JSON.parse(
                    localStorage.getItem("reservationLogSessions") || "[]"
                );
                allSessions.push(newSession);
                localStorage.setItem(
                    "reservationLogSessions",
                    JSON.stringify(allSessions)
                );

                // [LLM] 사용자가 "예매하기" 버튼을 클릭한 로그를 기록합니다.
                addReservationLog({
                    sessionId: backendSessionId,
                    page: "Start",
                    event: "click",
                    target_id: "start-to-reservation",
                    tag: "button",
                    text: "예매하기 버튼 클릭",
                });
            } else {
                // [LLM] 세션 생성 실패 시 경고 메시지를 출력합니다.
                console.warn("백엔드에서 sessionId가 반환되지 않음");
            }
        } catch (error) {
            // [LLM] 세션 생성 중 오류 발생 시 콘솔에 출력합니다.
            console.error("세션 생성 실패:", error);
        }

        // [LLM] 예약 페이지로 이동하며 생성된 sessionId를 함께 전달합니다.
        navigate("/reservation", {
            state: { reset: true, sessionId: backendSessionId },
        });
    };
    
    // [LLM] 조회 버튼 클릭 시 조회용 세션을 생성하고 전화번호 입력 페이지로 이동합니다.
    const handleStartSearch = async () => {
        let backendSessionId: string | null = null;

        try {
            // [LLM] 백엔드에 세션 생성 요청을 보냅니다. 목적은 "history", 현재 페이지는 "Start"입니다.
            const response = await axios.post(
                "http://localhost:3000/sessions/start",
                {
                    purpose: "history",
                    current_page: "Start",
                }
            );
            const sessionData = response.data;
            backendSessionId = sessionData.sessionId;

            if (backendSessionId) {
                // [LLM] 생성된 히스토리 세션 정보를 localStorage에 저장합니다.
                localStorage.setItem("currentHistorySession", JSON.stringify(sessionData));

                // [LLM] 사용자가 "조회하기" 버튼을 클릭한 로그를 기록합니다.
                addHistoryLog({
                    sessionId: backendSessionId,
                    page: "Start",
                    event: "click",
                    target_id: "start-to-phonenumber",
                    tag: "button",
                    text: "조회하기 버튼 클릭",
                });
            } else {
                // [LLM] 세션 생성 실패 시 경고 메시지를 출력합니다.
                console.warn("백엔드에서 sessionId가 반환되지 않음");
            }
        } catch (error) {
            // [LLM] 세션 생성 중 오류 발생 시 콘솔에 출력합니다.
            console.error("조회 세션 생성 실패:", error);
        }

        // [LLM] 전화번호 입력 페이지로 이동하며 sessionId를 함께 전달합니다.
        navigate("/phonenumber", {
            state: { sessionId: backendSessionId },
        });
    };

    return (
        <div>
            {/* [LLM] 페이지 제목을 설정합니다. */}
            <title>Start</title>

            {/* [LLM] 서비스 로고를 표시합니다. */}
            <div className="logo">
                <img className="main-logo" src={logoMain} alt="메인로고" />
            </div>

            {/* [LLM] 예매 및 조회 버튼을 포함한 컨테이너입니다. */}
            <div className="button-container">
                {/* [LLM] 예매 버튼: 예약 플로우를 시작합니다. */}
                <button
                    id="start-to-reservation"
                    className={`${styles.button} reservation`}
                    onClick={handleStartReservation}
                >
                    예매하기
                </button>

                {/* [LLM] 조회 버튼: 예매 내역 조회 플로우를 시작합니다. */}
                <button
                    id="start-to-phonenumber"
                    className={`${styles.button} look-up`}
                    onClick={handleStartSearch}
                >
                    조회하기
                </button>
            </div>
        </div>
    );
};

export default Start;