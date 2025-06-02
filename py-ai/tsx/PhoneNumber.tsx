// [LLM] 전화번호를 입력받아 예매 내역을 조회하는 페이지입니다.
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { updateHistorySession, addHistoryLog } from "../utils/session";
import "../styles/PhoneNumber.css";
import deleteIcon from "../assets/delete-button.svg";
import styles from "../styles/Button.module.css";
import PhoneModal from "../components/PhoneModal";

const PhoneNumber = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const sessionId = location.state?.sessionId;

    const [inputDigits, setInputDigits] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // [LLM] PhoneNumber 페이지 진입 시 세션 업데이트 및 페이지 도착 로그 기록
    useEffect(() => {
        if (!sessionId) return;

        updateHistorySession({
            sessionId,
            current_page: "PhoneNumber",
            previous_pages: ["Start"],
        });

        const raw = localStorage.getItem("currentHistorySession");
        if (raw) {
            const session = JSON.parse(raw);
            const alreadyLogged = session.logs?.some(
                (log: any) =>
                    log.page === "PhoneNumber" &&
                    log.event === "navigate" &&
                    log.target_id === "page-load"
            );

            if (!alreadyLogged) {
                addHistoryLog({
                    sessionId,
                    page: "PhoneNumber",
                    event: "navigate",
                    target_id: "page-load",
                    tag: "system",
                    text: "PhoneNumber 페이지 도착",
                });
            }
        }
    }, [sessionId]);

    // [LLM] 숫자 버튼 클릭 시 전화번호 입력 처리 및 로그
    const handleNumberClick = (num: string) => {
        if (inputDigits.length >= 11) return;
        const newDigits = inputDigits + num;
        setInputDigits(newDigits);

        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "PhoneNumber",
                event: "click",
                target_id: `digit-${num}`,
                tag: "button",
                text: `전화번호 입력 중: ${newDigits}`,
            });
        }
    };

    // [LLM] 지우기 버튼 클릭 시 마지막 자리 삭제 및 로그
    const handleDelete = () => {
        const newDigits = inputDigits.slice(0, -1);
        setInputDigits(newDigits);

        if (sessionId) {
            addHistoryLog({
                sessionId,
                page: "PhoneNumber",
                event: "click",
                target_id: "delete-button",
                tag: "button",
                text: `전화번호 지움: ${newDigits}`,
            });
        }
    };

    // [LLM] 전화번호 형식 (3-4-4)으로 변환하여 표시합니다.
    const getFormattedPhone = () => {
        const d = inputDigits;
        if (d.length <= 3) return d;
        if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
        return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
    };

    // [LLM] 다음 버튼 클릭 시 유효성 검사 후 조회 페이지로 이동 또는 모달/알림
    const handleNextClick = () => {
        if (inputDigits.length !== 11) {
            if (sessionId) {
                addHistoryLog({
                    sessionId,
                    page: "PhoneNumber",
                    event: "click",
                    target_id: "phoneNumber-to-history",
                    tag: "button",
                    text: "입력 자리수 부족 - 모달 창 띄움",
                });
            }
            setIsModalOpen(true);
            return;
        }

        if (!inputDigits.startsWith("010")) {
            if (sessionId) {
                addHistoryLog({
                    sessionId,
                    page: "PhoneNumber",
                    event: "click",
                    target_id: "phoneNumber-to-history",
                    tag: "button",
                    text: `010 아님 - 입력값: ${inputDigits}`,
                });
            }
            alert("전화번호는 010으로 시작해야 합니다.");
            return;
        }

        // [LLM] localStorage에서 전화번호와 일치하는 예매 데이터 존재 여부 확인
        let found = false;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            try {
                const raw = localStorage.getItem(key);
                if (!raw) continue;
                const data = JSON.parse(raw);

                if (Array.isArray(data)) {
                    if (
                        data.some(
                            (item) =>
                                item?.completed === true &&
                                item?.paymentInfo?.phoneNumber === inputDigits
                        )
                    ) {
                        found = true;
                        break;
                    }
                }

                if (
                    data?.completed === true &&
                    data?.paymentInfo?.phoneNumber === inputDigits
                ) {
                    found = true;
                    break;
                }
            } catch {
                continue;
            }
        }

        if (found) {
            if (sessionId) {
                addHistoryLog({
                    sessionId,
                    page: "PhoneNumber",
                    event: "click",
                    target_id: "phoneNumber-to-history",
                    tag: "button",
                    text: "전화번호 조회 버튼 클릭",
                });
            }

            navigate("/history", {
                state: {
                    phoneNumber: inputDigits,
                    sessionId,
                },
            });
        } else {
            if (sessionId) {
                addHistoryLog({
                    sessionId,
                    page: "PhoneNumber",
                    event: "click",
                    target_id: "phoneNumber-to-history",
                    tag: "button",
                    text: `조회 실패 - 존재하지 않는 전화번호: ${inputDigits}`,
                });
            }
            alert("입력한 전화번호로 완료된 예약 내역이 없습니다.");
        }
    };

    // [LLM] UI 구성: 제목, 입력창, 키패드, 버튼, 모달 포함
    return (
        <div className="phone-number">
            <p className="phone-number-title">전화번호 입력</p>

            {/* [LLM] 입력된 전화번호를 표시하는 읽기 전용 input */}
            <input
                className="phone-number-input"
                type="text"
                value={inputDigits.length === 0 ? "" : getFormattedPhone()}
                readOnly
                placeholder="전화번호를 입력해주세요."
            />

            {/* [LLM] 숫자 키패드 UI */}
            <div className="keypad">
                {[
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "empty",
                    "0",
                    "del",
                ]
                    .reduce((rows, key, idx) => {
                        const rowIdx = Math.floor(idx / 3);
                        if (!rows[rowIdx]) rows[rowIdx] = [];
                        rows[rowIdx].push(key);
                        return rows;
                    }, [] as string[][])
                    .map((row, i) => (
                        <div key={i} className="keypad-row">
                            {row.map((key, j) => {
                                if (key === "empty") {
                                    return (
                                        <button
                                            className="phone-key"
                                            key={`empty-${i}-${j}`}
                                            disabled
                                            style={{ visibility: "hidden" }}
                                        ></button>
                                    );
                                }

                                if (key === "del") {
                                    return (
                                        <button
                                            id="phone-key-delete"
                                            className="phone-key-delete"
                                            key={`del-${i}-${j}`}
                                            onClick={handleDelete}
                                        >
                                            <img
                                                className="delete-img"
                                                src={deleteIcon}
                                                alt="delete"
                                            />
                                        </button>
                                    );
                                }

                                return (
                                    <button
                                        id="phone-key"
                                        className="phone-key"
                                        key={`num-${i}-${j}`}
                                        onClick={() => handleNumberClick(key)}
                                    >
                                        {key}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
            </div>

            {/* [LLM] 이전 / 다음 버튼 */}
            <div className="nav-buttons">
                <button
                    id="phoneNumber-to-home"
                    className={styles.button}
                    onClick={() => navigate("/")}
                >
                    이전
                </button>
                <button
                    id="phoneNumber-to-history"
                    className={styles.button}
                    onClick={handleNextClick}
                >
                    다음
                </button>
            </div>

            {/* [LLM] 전화번호 자리수 부족 시 PhoneModal 모달창 열림 */}
            {isModalOpen && (
                <PhoneModal
                    onClose={() => {
                        setIsModalOpen(false);
                        if (sessionId) {
                            addHistoryLog({
                                sessionId,
                                page: "PhoneNumber",
                                event: "click",
                                target_id: "modal-ok-button",
                                tag: "button",
                                text: "자리수 부족 모달창 확인",
                            });
                        }
                    }}
                />
            )}
        </div>
    );
};

export default PhoneNumber;