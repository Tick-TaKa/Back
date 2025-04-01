import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styleb from "../styles/Box.module.css";
import styles from "../styles/Button.module.css";
import "../styles/TrainList.css";

interface Train {
    trainId: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    availableSeats: number;
    disabled?: boolean;
}

const dummyTrains: Train[] = [
    {
        trainId: "DUMMY1",
        departureTime: "05:13",
        arrivalTime: "07:14",
        price: 69000,
        availableSeats: 36,
    },
    {
        trainId: "DUMMY2",
        departureTime: "06:21",
        arrivalTime: "08:20",
        price: 69000,
        availableSeats: 10,
    },
    {
        trainId: "DUMMY3",
        departureTime: "08:36",
        arrivalTime: "10:02",
        price: 71600,
        availableSeats: 0,
        disabled: true,
    },
    {
        trainId: "DUMMY4",
        departureTime: "11:03",
        arrivalTime: "13:14",
        price: 69000,
        availableSeats: 29,
    },
    {
        trainId: "DUMMY5",
        departureTime: "12:27",
        arrivalTime: "15:20",
        price: 69000,
        availableSeats: 12,
    },
    {
        trainId: "DUMMY6",
        departureTime: "15:13",
        arrivalTime: "17:14",
        price: 54000,
        availableSeats: 97,
    },
    {
        trainId: "DUMMY7",
        departureTime: "16:21",
        arrivalTime: "18:20",
        price: 69000,
        availableSeats: 23,
    },
    {
        trainId: "DUMMY8",
        departureTime: "18:36",
        arrivalTime: "20:02",
        price: 71600,
        availableSeats: 0,
        disabled: true,
    },
    {
        trainId: "DUMMY9",
        departureTime: "21:03",
        arrivalTime: "23:14",
        price: 32000,
        availableSeats: 17,
    },
    {
        trainId: "DUMMY10",
        departureTime: "22:27",
        arrivalTime: "01:20",
        price: 69000,
        availableSeats: 8,
    },
];

const TrainList = () => {
    const navigate = useNavigate();
    const [selectedTrainId, setSelectedTrainId] = useState<string | null>(
        () => {
            return localStorage.getItem("selectedTrainId") || null;
        }
    );

    useEffect(() => {
        if (selectedTrainId !== null) {
            localStorage.setItem("selectedTrainId", selectedTrainId);
        }
    }, [selectedTrainId]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleSelect = (train: Train) => {
        if (!train.disabled) {
            setSelectedTrainId(train.trainId);
        }
    };

    const handleNext = () => {
        if (selectedTrainId === null) {
            alert("기차를 선택해주세요.");
            return;
        }
        navigate("/reservation/select-seat");
    };

    return (
        <div>
            <title>TimeTable</title>
            <div className={styleb.box}>
                <h2 className="page-title">시간대 선택</h2>
                <hr className="page-title-bar" />

                <div className="content-container">
                    <table>
                        <thead>
                            <tr>
                                <th>출발</th>
                                <th>도착</th>
                                <th>가격</th>
                                <th>남은 좌석 수</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dummyTrains.map((train) => (
                                <tr
                                    key={train.trainId}
                                    onClick={() => handleSelect(train)}
                                    style={{
                                        opacity: train.disabled ? 0.3 : 1,
                                        border:
                                            train.trainId === selectedTrainId
                                                ? "3px solid #4A90E2"
                                                : "1px solid transparent",
                                        backgroundColor:
                                            train.trainId === selectedTrainId
                                                ? "#E3F2FD"
                                                : "transparent",
                                        cursor: train.disabled
                                            ? "not-allowed"
                                            : "pointer",
                                        transition: "0.3s ease-in-out",
                                    }}
                                >
                                    <td>{train.departureTime}</td>
                                    <td>{train.arrivalTime}</td>
                                    <td>{train.price.toLocaleString()}원</td>
                                    <td
                                        style={{
                                            color:
                                                train.availableSeats < 20
                                                    ? "#FF1744"
                                                    : "#111111",
                                        }}
                                    >
                                        {train.availableSeats}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="display-button">
                <button
                    className={`${styles.button} train-list-back`}
                    onClick={handleBack}
                >
                    이전
                </button>
                <button
                    className={`${styles.button} train-list-search`}
                    onClick={handleNext}
                >
                    다음
                </button>
            </div>
        </div>
    );
};

export default TrainList;


// 표를 선택할 때 지금 표 때문에 하이트라이트가 끊겨서 나오는데 그렇게 하지 말고 하나의 하이라이트로 만들기. 표의 선 없애고. 이건 스타일로 지정?