// [LLM] 예약 내역이 없을 때 History 페이지 내에 표시되는 컴포넌트
import {
    addHistoryLog,
    markHistorySessionCompleted,
} from "../utils/session";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Button.module.css";
import "../styles/History.css";

const HistoryNone = () => {
    const navigate = useNavigate();

    // [LLM] "메인 화면으로" 버튼 클릭 시 실행되는 함수
    const handleGoHome = () => {
        const sessionRaw = localStorage.getItem("currentHistorySession");
        const sessionId = sessionRaw ? JSON.parse(sessionRaw)?.sessionId : null;

        if (sessionId) {
            // [LLM] 사용자가 예매 내역이 없어서 메인으로 돌아가는 동작을 로그에 기록
            addHistoryLog({
                sessionId,
                page: "HistoryNone",
                event: "click",
                target_id: "historyNone-to-home",
                tag: "button",
                text: "예매 없어서 메인으로 돌아감",
                url: window.location.pathname,
            });

            // [LLM] 히스토리 세션을 종료하고, 목적지를 Start로 설정
            markHistorySessionCompleted({
                end_reason: "history_completed",
                current_page: "Start",
            });
        }

        // [LLM] 메인 페이지("/")로 라우팅
        navigate("/");
    };

    return (
        // [LLM] 예매 내역이 없을 때 보여지는 전체 컨테이너
        <div className="ticket-container-none">
            <hr className="page-title-bar" />

            {/* [LLM] 이미지와 메시지로 예매 없음 상태 표현 */}
            <div className="no-reservation-section">
                <img
                    src="/src/assets/failed-button.svg"
                    alt="no-reservation"
                    className="no-reservation-image"
                />
                <p className="no-reservation-text">
                    해당 조회기간에는
                    <br />
                    예매 내역이 없습니다.
                </p>
            </div>

            {/* [LLM] 메인 화면으로 이동하는 버튼 */}
            <button
                id="historyNone-to-home"
                className={styles.button}
                onClick={handleGoHome}
            >
                메인 화면으로
            </button>
        </div>
    );
};

export default HistoryNone;
