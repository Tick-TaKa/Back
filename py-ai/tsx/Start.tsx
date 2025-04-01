import { useNavigate } from "react-router-dom";
import logoMain from "../assets/lolgo_main.svg";
import styles from "../styles/Button.module.css";
import "../styles/Start.css";

const Start = () => {
    const navigate = useNavigate();

    return (
        <div>
            <title>Start</title>
            <div className="logo">
                <img className="main-logo" src={logoMain} alt="메인로고" />
            </div>
            <div className="button-container">
                <button
                    className={`${styles.button} reservation`}
                    onClick={() => navigate("/reservation")}
                >
                    예매하기
                </button>
                <button
                    className={`${styles.button} look-up`}
                    onClick={() => navigate("/phonenumber")}
                >
                    조회하기
                </button>
            </div>
        </div>
    );
};

export default Start;
