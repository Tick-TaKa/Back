import React from "react";
import "../styles/StationSelector.css";

interface Props {
    stations: string[];
    onSelect: (station: string) => void;
}

const StationSelector: React.FC<Props> = ({ stations, onSelect }) => {
    return (
        <div className="station-popup">
        <div className="station-popup-title">역명</div>
        <div className="station-grid">
            {stations.map((station) => (
            <button
                key={station}
                className="station-button"
                onClick={() => onSelect(station)}
            >
                {station}
            </button>
            ))}
        </div>
        </div>
    );
};

export default StationSelector;


// 여기서는 제일 최근에 reservation에서 선택한 전체 인원 수만큼 자리를 선택할 수 있게 해야 함. reservation의 모든 인원 수 고려!!!!!!!!