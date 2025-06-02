// [LLM] 카드 등록 페이지 - 사용자로부터 카드 정보를 받아 저장하고, 등록된 카드 정보를 로컬 및 서버에 저장하는 컴포넌트

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/Button.module.css";
import styleb from "../styles/Box.module.css";
import "../styles/AddCard.css";
import { addReservationLog, updateReservationLogSession } from "../utils/session";
import axios from "axios";

// [LLM] 카드사 목록 정의
const cardCompanies = ["NH농협", "KB국민", "카카오", "신한", "우리", "하나", "토스", "기업", "새마을"];

const AddCard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // [LLM] 이전 페이지(결제 페이지)에서 전달받은 결제 관련 정보 추출
    const { phoneNumber, phoneConfirmed, agree, reservationData, trainInfo, selectedSeats } = location.state || {};

    // [LLM] 로컬 스토리지에서 세션 ID 가져오기 (예외 처리 포함)
    const sessionId = (() => {
        try {
            return JSON.parse(localStorage.getItem("currentReservationLogSession") || "null")?.sessionId;
        } catch {
            return null;
        }
    })();

    // [LLM] 세션 상태 업데이트 및 페이지 진입 로그 기록
    useEffect(() => {
        if (sessionId) {
            updateReservationLogSession({
                location: "Addcard",
                previous_pages: ["Payment"],
            });

            const sessionRaw = localStorage.getItem("currentReservationLogSession");
            if (sessionRaw) {
                const session = JSON.parse(sessionRaw);
                const alreadyLogged = session.logs?.some(
                    (log: any) =>
                        log.page === "Addcard" &&
                        log.event === "navigate" &&
                        log.target_id === "page-load"
                );

                if (!alreadyLogged) {
                    addReservationLog({
                        sessionId,
                        page: "Addcard",
                        event: "navigate",
                        target_id: "page-load",
                        tag: "system",
                        text: "Addcard 페이지 도착",
                    });
                }
            }
        }
    }, [sessionId]);

    // [LLM] 버튼 클릭 로그 기록 함수
    const logClick = (target_id: string, text: string, tag = "button") => {
        if (!sessionId) return;
        addReservationLog({
            sessionId,
            page: "AddCard",
            event: "click",
            target_id,
            tag,
            text,
        });
    };

    // [LLM] 사용자 입력 상태 변수 정의
    const [selectedCompany, setSelectedCompany] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cvc, setCvc] = useState("");
    const [expiry, setExpiry] = useState("");
    const [password, setPassword] = useState("");

    // [LLM] 키패드 표시 여부 및 활성 필드 상태
    const [showKeypad, setShowKeypad] = useState(false);
    const [activeField, setActiveField] = useState<"cardNumber" | "cvc" | "expiry" | "password" | null>(null);

    // [LLM] 키패드를 통해 각 입력 필드의 값을 업데이트하고 로그 기록
    const updateFieldValue = (field: typeof activeField, value: string) => {
        switch (field) {
            case "cardNumber": {
                // [LLM] 카드번호는 숫자만 추출하고 4자리마다 하이픈 추가 포맷 적용하여 16자리 숫자 받음
                const formattedCard = value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1-");
                setCardNumber(formattedCard);
                logClick("addcard-card-number", `카드번호 입력: ${formattedCard}`);
                break;
            }
            case "cvc": {
                // [LLM] CVC는 3자리 숫자 받음
                const cvcVal = value.replace(/\D/g, "").slice(0, 3);
                setCvc(cvcVal);
                logClick("addcard-card-cvc", `CVC 입력: ${cvcVal}`);
                break;
            }
            case "expiry": {
                // [LLM] 유효기간은 MMYY 형식으로 숫자만 최대 4자리 허용
                const expiryVal = value.replace(/\D/g, "").slice(0, 4);
                setExpiry(expiryVal);
                logClick("addcard-card-period", `유효기간 입력: ${expiryVal}`);
                break;
            }
            case "password": {
                // [LLM] 카드 비밀번호는 앞의 두 자리만 받음
                const passVal = value.replace(/\D/g, "").slice(0, 2);
                setPassword(passVal);
                logClick("addcard-card-password", `비밀번호 앞자리 입력: ${passVal}`);
                break;
            }
            default:
                break;
        }
    };

    // [LLM] 가상 키패드 렌더링 함수 - 숫자와 삭제 버튼 포함
    const renderKeypad = () => (
        <div className="payment-keypad-modal">
            <div className="payment-keypad">
                {[1,2,3,4,5,6,7,8,9,"",0,"←"].map((key, i) => (
                <button
                    key={i}
                    className="payment-keypad-button"
                    onClick={() => {
                        const currentValue = (() => {
                            switch (activeField) {
                                case "cardNumber": return cardNumber.replace(/\D/g, "");
                                case "cvc": return cvc;
                                case "expiry": return expiry;
                                case "password": return password;
                                default: return "";
                            }
                        })();

                        if (key === "←") {
                            updateFieldValue(activeField, currentValue.slice(0, -1));
                        } else if (typeof key === "number") {
                            updateFieldValue(activeField, currentValue + key.toString());
                        }
                    }}
                >
                    {key}
                </button>
                ))}
                <button
                    className="payment-keypad-confirm"
                    onClick={() => {
                        setShowKeypad(false);
                        setActiveField(null);
                    }}
                >
                    확인
                </button>
            </div>
        </div>
    );

    // [LLM] 카드 입력 검증 → 로컬 및 서버에 카드 저장 후 결제 페이지로 이동
    const handleSubmit = () => {
         // [LLM] 카드사 선택 여부 확인 → 선택하지 않았을 경우 사용자에게 경고 알림
        if (!selectedCompany) return alert("카드사를 선택해주세요.");

        // [LLM] 카드번호 입력 검증: 숫자만 추출 후 길이가 정확히 16자리인지 확인
        if (cardNumber.replace(/\D/g, "").length !== 16)
            return alert("카드 번호 16자리를 정확히 입력해주세요.");

        // [LLM] CVC 입력 검증: 길이가 3자리인지 확인
        if (cvc.length !== 3)
            return alert("CVC 번호 3자리를 정확히 입력해주세요.");

        // [LLM] 유효기간 입력 검증: 숫자 4자리(MMYY)인지 정규식으로 검사
        if (!/^\d{4}$/.test(expiry))
            return alert("유효기간 4자리(MMYY)를 입력해주세요.");

        // [LLM] 카드 비밀번호 입력 검증: 앞 2자리만 입력되어야 함
        if (password.length !== 2)
            return alert("카드 비밀번호 앞 2자리를 입력해주세요.");

        // [LLM] 입력된 카드번호에서 숫자만 추출 (예: 1234-5678-9012-3456 → 1234567890123456)
        const rawCard = cardNumber.replace(/\D/g, "");

         // [LLM] 사용자 화면에 표시될 카드번호 마스킹 처리 (앞 4자리 + 뒤 4자리만 보이게 구성)
        const maskedCardNumber = `${rawCard.slice(
            0,
            4
        )}-****-****-${rawCard.slice(-4)}`;

        // [LLM] 로컬에 저장된 기존 카드 목록 불러오기 (없으면 빈 배열)
        const storedCards = JSON.parse(
            localStorage.getItem("customCards") || "[]"
        );

        // [LLM] 새로 등록할 카드 정보 객체 구성
        const newCard = {
            id: Date.now(),
            cardCompany: selectedCompany,
            cardNumber: maskedCardNumber,
            last4Digits: rawCard.slice(-4),
            expirationDate: expiry.replace(/(\d{2})(\d{2})/, "$1/$2"),
            ownerPhone: phoneNumber.replace(/-/g, ""),
        };

        logClick("addcard-success", "카드 등록");

        localStorage.setItem(
            "customCards",
            JSON.stringify([...storedCards, newCard])
        );

        // [LLM] 민감 정보를 포함한 카드 등록 요청을 백엔드에 전송
        axios
            .post(
                `http://localhost:3000/cards/${phoneNumber.replace(/-/g, "")}`,
                {
                    cardCompany: selectedCompany,
                    cardNumber: rawCard.replace(/(\d{4})(?=\d)/g, "$1-"),
                    expirationDate: expiry.replace(/(\d{2})(\d{2})/, "$1/$2"),
                    cvc,
                    password,
                }
            )
            .then(() => {
                // [LLM] 서버 등록 완료 시 사용자에게 알림 후 결제 페이지로 이동
                alert("카드 등록이 완료되었습니다!");
                navigate("/reservation/payment", {
                    state: {
                        fromAddCard: true,
                        phoneNumber,
                        phoneConfirmed,
                        agree,
                        reservationData,
                        trainInfo,
                        selectedSeats,
                    },
                });
            })
            .catch((err) => {
                // [LLM] 서버 등록 실패 시 에러 출력 및 사용자 알림
                console.error("카드 등록 실패:", err);
                alert("서버에 카드 등록 중 오류가 발생했습니다.");
            });
    };

    // [LLM] 이전 버튼 클릭 시 결제 페이지로 되돌아감
    const handleBack = () => {
        logClick("addcard-to-payment", "결제화면으로 돌아가기");
        navigate(-1);
    };


    // [LLM] 렌더링: 카드 등록 UI와 입력 필드, 버튼 구성
    return (
        <div>
            {/* [LLM] 카드 등록 영역 */}
            <div className={styleb.box}>
                <div className="add-card-container">
                    <h2 className="page-title">카드 등록</h2>
                    <hr className="page-title-bar" />

                    <div className="content-container">
                        {/* [LLM] 카드사 선택 버튼 목록 */}
                        <div>카드사 선택</div>
                        <div className="addcard-selected-container">
                            {cardCompanies.map((company) => (
                                <button
                                    key={company}
                                    className={`addcard-selected ${selectedCompany === company ? "active" : ""}`}
                                    onClick={() => {
                                        setSelectedCompany(company);
                                        logClick("addcard-selected", `카드사 선택: ${company}`, "button");
                                    }}
                                    id="addcard-selected"
                                >
                                    {company}
                                </button>
                            ))}
                        </div>

                        {/* [LLM] 카드번호 입력 */}
                        <div>
                            <div>카드 번호</div>
                            <input
                                type="text"
                                value={cardNumber}
                                readOnly
                                onClick={() => {
                                    setActiveField("cardNumber");
                                    setShowKeypad(true);
                                }}
                                placeholder="카드번호 16자리"
                                className="addcard-inform-input"
                                id="addcard-card-number"
                            />
                            {showKeypad && activeField && renderKeypad()}
                        </div>

                        {/* [LLM] CVC 입력 */}
                        <div>
                            <div>CVC</div>
                            <input
                                type="password"
                                value={cvc}
                                readOnly
                                onClick={() => {
                                    setActiveField("cvc");
                                    setShowKeypad(true);
                                }}
                                placeholder="cvc 번호 입력"
                                className="addcard-inform-input"
                                id="addcard-card-cvc"
                            />
                            {showKeypad && activeField && renderKeypad()}
                        </div>

                        {/* [LLM] 유효기간 입력 */}
                        <div>
                            <div>유효 기간</div>
                            <input
                                type="password"
                                value={expiry}
                                readOnly
                                onClick={() => {
                                    setActiveField("expiry");
                                    setShowKeypad(true);
                                }}
                                placeholder="MMYY"
                                className="addcard-inform-input"
                                id="addcard-card-period"
                            />
                            {showKeypad && activeField && renderKeypad()}
                        </div>

                        {/* [LLM] 비밀번호 입력 */}
                        <div>
                            <div>카드 비밀번호</div>
                            <input
                                type="password"
                                value={password}
                                readOnly
                                onClick={() => {
                                    setActiveField("password");
                                    setShowKeypad(true);
                                }}
                                placeholder="비밀번호 앞 2자리"
                                className="addcard-inform-input"
                                id="addcard-card-password"
                            />
                            {showKeypad && activeField && renderKeypad()}
                        </div>
                    </div>
                </div>
            </div>

            {/* 이전/등록 버튼 영역 */}
            <div className="display-button">
                {/* [LLM} 이전 페이지로 돌아가는 버튼 영역 */}
                <button className={`${styles.button} addcard-back`} id="addcard-to-payment" onClick={handleBack}>이전</button>
                {/* [LLM} 카드 등록하는 버튼 영역 */}
                <button className={`${styles.button} addcard-search`} id="addcard-success" onClick={handleSubmit}>등록하기</button>
            </div>
        </div>
    );
};

export default AddCard;