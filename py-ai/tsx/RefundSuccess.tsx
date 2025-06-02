// [LLM] 환불 성공 시 사용자에게 안내 메시지를 보여주는 페이지입니다. 예약 데이터를 기반으로 백엔드 환불 처리 및 세션 종료까지 수행합니다.

import "../styles/RefundSuccess.css";
import styles from "../styles/Button.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import { addHistoryLog } from "../utils/session";
import { useEffect } from "react";
import axios from "axios";

const RefundSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // [LLM] 이전 페이지(예: History.tsx)에서 전달된 환불 대상 예약 목록을 가져옵니다.
    const reservations = (location.state as any)?.reservations || [];

    // [LLM] 페이지 진입 시: 환불 API 호출 + 페이지 방문 로그 기록
    useEffect(() => {
        const sessionRaw = localStorage.getItem("currentHistorySession");
        const session = sessionRaw ? JSON.parse(sessionRaw) : null;
        const sessionId = session?.sessionId;

        // [LLM] 환불 요청 처리 (예약 ID 기준 삭제)
        const deleteReservations = async () => {
            for (const res of reservations) {
                try {
                    await axios.delete(`http://localhost:3000/refunds/${res.reservationId}`);
                    console.log(`환불 성공: ${res.reservationId}`);
                } catch (err) {
                    console.error(`환불 실패: ${res.reservationId}`, err);
                }
            }
        };

        deleteReservations();

        // [LLM] 세션 로그 기록
        if (sessionId) {
            const alreadyLogged = session?.logs?.some(
                (log: any) =>
                    log.page === "RefundSuccess" &&
                    log.event === "navigate" &&
                    log.target_id === "page-load"
            );

            if (!alreadyLogged) {
                addHistoryLog({
                    sessionId,
                    page: "RefundSuccess",
                    event: "navigate",
                    target_id: "page-load",
                    tag: "system",
                    text: "RefundSuccess 페이지 도착",
                });
            }
        }
    }, [reservations]);

    // [LLM] "메인 화면으로" 버튼 클릭 시: 세션 업데이트 → 종료 → 이동
    const handleHome = async () => {
        const sessionRaw = localStorage.getItem("currentHistorySession");

        if (sessionRaw) {
            const session = JSON.parse(sessionRaw);
            const sessionId = session.sessionId;

            // [LLM] 환불 완료 후 버튼 클릭 로그 기록
            addHistoryLog({
                sessionId,
                page: "RefundSuccess",
                event: "click",
                target_id: "refundSuccess-to-home",
                tag: "button",
                text: "환불 완료 후 메인으로 돌아감",
            });

            try {
                // [LLM] 1단계: 세션 목적을 'refund'로 업데이트
                await axios.patch("http://localhost:3000/sessions/update", {
                    sessionId,
                    newPurpose: "refund",
                    current_page: "RefundSuccess",
                });

                console.log("세션 목적 변경 성공");

                // [LLM] 2단계: 세션 종료
                await axios.patch("http://localhost:3000/sessions/end", {
                    sessionId,
                    status: "completed",
                    end_reason: "refund_completed",
                    current_page: "Start",
                });

                // [LLM] 3단계: 로컬 세션 히스토리 업데이트
                const sessions = JSON.parse(localStorage.getItem("historySessions") || "[]");
                const index = sessions.findIndex((s: any) => s.sessionId === sessionId);
                const updated = {
                    ...session,
                    status: "completed",
                    purpose: "refund",
                    end_reason: "refund_completed",
                    current_page: "Start",
                    last_interaction: new Date().toISOString(),
                };
                if (index !== -1) {
                    sessions[index] = updated;
                } else {
                    sessions.push(updated);
                }
                localStorage.setItem("historySessions", JSON.stringify(sessions));

                // [LLM] 현재 세션 삭제
                localStorage.removeItem("currentHistorySession");

                console.log("세션 종료 완료");
            } catch (err) {
                console.error("세션 업데이트 또는 종료 실패:", err);
            }
        }

        // [LLM] 메인 페이지로 이동
        navigate("/");
    };

    // [LLM] 화면 구성: 환불 완료 안내 + 버튼 제공
    return (
        <div className="refund-success">
            {/* [LLM] 환불 성공 이미지 */}
            <img
                src="/src/assets/success-button.svg"
                className="success-image"
                alt="환불 성공 이미지"
            />

            {/* [LLM] 사용자에게 환불 완료를 알리는 텍스트 */}
            <div className="ment">
                <p>환불 처리가 완료되었습니다.</p>
                <p>Tiketaka를 이용해주셔서 감사합니다.</p>
            </div>

            {/* [LLM] 환불 성공 후 메인으로 이동하는 버튼 */}
            <button
                id="refundSuccess-to-home"
                className={`${styles.button} go-main`}
                onClick={handleHome}
            >
                메인 화면으로
            </button>
        </div>
    );
};

export default RefundSuccess;
