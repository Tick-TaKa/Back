import "../styles/RefundSuccess.css";
import styles from "../styles/Button.module.css";
import { useNavigate } from "react-router-dom";

const RefundSuccess = () => {
    const navigate = useNavigate();

    const handleHome = () => {
        navigate("/");
    };

    return (
        <div className="refund-success">
            <img
                src="/src/assets/success-button.svg"
                className="success-image"
                alt="환불 성공 이미지"
            />
            <div className="ment">
                <p>환불 처리가 완료되었습니다.</p>
                <p>Tiketaka를 이용해주셔서 감사합니다.</p>
            </div>
            {/* 환불 성공창에서 메인 화면으로 이동하는 버튼 */}
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
