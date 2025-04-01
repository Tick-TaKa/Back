import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Button.module.css";
import styleb from "../styles/Box.module.css";
import "../styles/AddCard.css";

const cardCompanies = ["NH농업", "KB국민", "카카오", "신한", "우리", "하나", "토스", "기업", "새마을"];

const AddCard: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCompany, setSelectedCompany] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cvc, setCvc] = useState("");
    const [expiry, setExpiry] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = () => {
        // 카드 정보 저장 로직 (API 연동 가능)
        console.log({ selectedCompany, cardNumber, cvc, expiry, password });
        navigate(-1); // 이전 페이지로 이동
    };

    const handleback = () => {
        navigate(-1);
    }

    return (
        <div>
            <title>RegisterCredit</title>
            <div className={styleb.box}>
                <div className="add-card-container">
                    <h2 className="page-title">카드 등록</h2>
                    <hr className="page-title-bar" />

                    <div className="content-container">
                        <div>카드사 선택</div>
                        <div className="addcard-selected-container">
                            {cardCompanies.map((company) => (
                            <button
                                className="addcard-selected"
                                onClick={() => setSelectedCompany(company)}
                            >
                                {company}
                            </button>
                            ))}
                        </div>
                        <div>
                            <div>카드 번호</div>
                            <input type="text" placeholder="카드 번호" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                            {/* 4개씩 16개 숫자 입력하면 4개씩 -로 묶이고 마지막 4자리는 *로 표시  */}
                        </div>
                        
                        <div>
                            <div>CVC</div>
                            <input type="text" placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} />
                        {/* 숫자 세개만 입력받고 모두 *로 표시 */}
                        </div>

                        <div>
                            <div>유효 기간</div>
                            <input type="text" placeholder="유효 기간 (MM/YY)" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                            {/* MM/YY 형식으로 숫자 네자리 입력받고 모두 *로 표시 */}
                        </div>
                        
                        <div>
                            <div>카드 비밀번호</div>
                            <input type="password" placeholder="비밀번호 앞 2자리" value={password} onChange={(e) => setPassword(e.target.value)} />
                            {/* 숫자 두 개 입력 받고 *로 표시 */}
                        </div>
                    </div>
                </div>
            </div>
            <div className="display-button">
                <button className={`${styles.button} addcard-back`} onClick={handleback}>이전</button>
                <button className={`${styles.button} addcard-search`} onClick={handleSubmit}>등록하기</button>
                {/* 등록하기 누르면 카드 이미지가 payment className="card-box add-card" 이 부분에 추가하고, 카드 추가할 수록 그 옆으로 캐러셀처럼 옆으로 슬라이드 되고 카드 이미지 추가됨.  */}
            </div>
        </div>

    );
};

export default AddCard;
