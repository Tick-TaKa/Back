import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Payment.css";
import styleb from "../styles/Box.module.css";
import styles from "../styles/Button.module.css";

interface Card {
    id: number;
    last4Digits: string;
}

const Payment: React.FC = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [cards, setCards] = useState<Card[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [agree, setAgree] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("");

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhoneNumber(e.target.value);
    };

    const fetchCards = () => {
        // 여기에 실제 API 요청을 넣어 전화번호 기반 카드 정보를 가져올 수 있음
        if (phoneNumber === "010-1234-5678") {
            setCards([
                { id: 1, last4Digits: "1234" },
                { id: 2, last4Digits: "5678" },
            ]);
        } else {
            setCards([]);
        }
    };

    const handleNext = () => {
        if (cards.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % (cards.length + 1));
        }
    };

    const handlePrev = () => {
        if (cards.length > 0) {
            setCurrentIndex(
                (prev) => (prev - 1 + (cards.length + 1)) % (cards.length + 1)
            );
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleEnd = () => {
        alert("결제가 완료되었습니다.");
        navigate("/reservation/payment/end");
    };

    return (
        <div>
            <title>Payment</title>
            <div className={styleb.box}>
                <h2 className="page-title">결제창</h2>
                <hr className="page-title-bar" />

                <div className="content-container">
                    <div className="trip-info">
                        <p>출발: 서울역 → 도착: 부산역</p>
                        <p>날짜: 2025.mm.dd</p> 
                        {/* reservation에서 선택한 날짜 정보가 여기로 넘어와야 함!!!! */}
                        <p>총 인원: 성인 2명, 어린이 1명</p>
                        {/*reservation에서 선택한 인원수가 여기로 넘어와야 함!!!*/}
                        <p>지불하실 금액: nnn,nnn원</p>
                    </div>

                    <div>
                        <label>개인정보 동의</label>
                        <input
                            type="checkbox"
                            checked={agree}
                            onChange={() => setAgree(!agree)}
                        />
                    </div>

                    <div>
                        <label>전화번호 입력</label>
                        <input
                            type="text"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                        />
                        <button onClick={fetchCards}>확인</button>
                    </div>

                    <div className="payment-method">
                        <button onClick={() => setPaymentMethod("credit")}>
                            신용카드
                        </button>
                        <button onClick={() => setPaymentMethod("kakao")}>
                            카카오페이
                        </button>
                        <button onClick={() => setPaymentMethod("mobile")}>
                            휴대폰 결제
                        </button>
                        <button
                            onClick={() => setPaymentMethod("register-card")}
                        >
                            카드 등록
                        </button>
                    </div>

                    <div className="card-slider">
                        <button onClick={handlePrev}>&lt;</button>
                        {cards.length > 0 && currentIndex < cards.length ? (
                            <div className="card-box">
                                기존 카드 {cards[currentIndex].last4Digits}
                            </div>
                        ) : (
                            <div
                                className="card-box add-card"
                                onClick={() =>
                                    navigate("/reservation/payment/addcard")
                                }
                            >
                                +
                            </div>
                        )}
                        <button onClick={handleNext}>&gt;</button>
                    </div>
                </div>
            </div>
            <div className="display-button">
                <button
                    className={`${styles.button} payment-back`}
                    onClick={handleBack}
                >
                    이전
                </button>
                <button
                    className={`${styles.button} payment-next`}
                    onClick={handleEnd}
                >
                    다음
                </button>
            </div>
        </div>
    );
};

export default Payment;
