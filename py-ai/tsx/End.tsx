// [LLM] 예약 완료 후 마지막 페이지 (확인 후 메인으로 이동)

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoMain from "../assets/lolgo_main.svg";
import styles from "../styles/Button.module.css";
import {
    markSessionCompleted,
    updateReservationLogSession,
    addReservationLog,
} from "../utils/session";

const End = () => {
    const navigate = useNavigate();

    // [LLM] 세션 ID를 상태로 보관
    const [sessionId, setSessionId] = useState<string | null>(null);

    // [LLM] 공통 로그 기록 함수 (클릭 이벤트용)
    const logClick = (target_id: string, text: string, tag = "button") => {
        if (!sessionId) return;
        addReservationLog({
            sessionId,
            page: "End",
            event: "click",
            target_id,
            tag,
            text,
        });
    };

    // [LLM] 마운트 시:
    // 1. 세션 로딩
    // 2. current_page 업데이트
    // 3. End 페이지 진입 로그 기록
    useEffect(() => {
        const sessionRaw = localStorage.getItem("currentReservationLogSession");
        if (!sessionRaw) return;

        const session = JSON.parse(sessionRaw);
        const sid = session.sessionId;
        setSessionId(sid);

        updateReservationLogSession({
            sessionId: sid,
            current_page: "Start", // 다음 페이지 목적지는 Start
        });

        const alreadyLogged = session.logs?.some(
            (log: any) =>
                log.page === "End" &&
                log.event === "navigate" &&
                log.target_id === "page-load"
        );

        if (!alreadyLogged) {
            addReservationLog({
                sessionId: sid,
                page: "End",
                event: "navigate",
                target_id: "page-load",
                tag: "system",
                text: "End 페이지 도착",
            });
        }
    }, []);

    // [LLM] 확인 버튼 클릭 → 세션 종료 + 홈으로 이동
    const handleConfirm = async () => {
        logClick("end-to-home", "확인 클릭 후 메인으로 이동");
        markSessionCompleted(); // 세션 종료
        navigate("/");          // 메인으로 이동
    };

    return (
        // [LLM] 전체 페이지 컨테이너
        <div>
            <title>End</title>

            {/* [LLM] 로고 영역 */}
            <div className="logo">
                <img src={logoMain} alt="main-logo" />
            </div>

            {/* [LLM] 버튼 + 종료 메시지 */}
            <div className="button-container">
                <button
                    className={`${styles.button} reservation`}
                    onClick={handleConfirm}
                    id="end-to-home"
                >
                    확인
                </button>

                {/* [LLM] 사용자에게 감사 메시지 출력 */}
                <div style={{ textAlign: "center" }}>
                    이용해 주셔서 감사합니다.
                </div>
            </div>
        </div>
    );
};

export default End;
