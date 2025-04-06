import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PhoneNumber.css";
import deleteIcon from "../assets/delete-button.svg";
import styles from "../styles/Button.module.css";
import PhoneModal from "../components/PhoneModal";

const PhoneNumber = () => {
    const navigate = useNavigate();
    const [inputDigits, setInputDigits] = useState(""); // 입력된 전체 전화번호 (하이픈 없이 11자리)
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 숫자 버튼 입력
    const handleNumberClick = (num: string) => {
        if (inputDigits.length >= 11) return;
        setInputDigits((prev) => prev + num);
    };

    // 지우기 버튼
    const handleDelete = () => {
        setInputDigits((prev) => prev.slice(0, -1));
    };

    // 포맷: 010-XXXX-XXXX
    const getFormattedPhone = () => {
        const d = inputDigits;
        if (d.length <= 3) return d;
        if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
        return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
    };

    // 다음 버튼
    const handleNextClick = () => {
        if (inputDigits.length !== 11) {
            setIsModalOpen(true);
            return;
        }

        if (!inputDigits.startsWith("010")) {
            alert("전화번호는 010으로 시작해야 합니다.");
            return;
        }

        navigate("/history", { state: { phoneNumber: inputDigits } });
    };

    return (
        <div className="phone-number">
            <p className="phone-number-title">전화번호 입력</p>

            <input
                className="phone-number-input"
                type="text"
                value={inputDigits.length === 0 ? "" : getFormattedPhone()}
                readOnly
                placeholder="전화번호를 입력해주세요."
            />

            <div className="keypad">
                {[
                    ["1", "2", "3"],
                    ["4", "5", "6"],
                    ["7", "8", "9"],
                    ["empty", "0", "del"],
                ].map((row, i) => (
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

            <div className="nav-buttons">
                {/* 전번입력->홈으로 이동하는 버튼 */}
                <button
                    id="phoneNumber-to-home"
                    className={styles.button}
                    onClick={() => navigate("/")}
                >
                    이전
                </button>
                {/* 전번입력->예매 조회로 이동하는 버튼 */}
                <button
                    id="phoneNumber-to-history"
                    className={styles.button}
                    onClick={handleNextClick}
                >
                    다음
                </button>
            </div>

            {isModalOpen && (
                <PhoneModal onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};

export default PhoneNumber;
