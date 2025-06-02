// [LLM] 역 선택 팝업 컴포넌트입니다. 사용자가 출발역 또는 도착역을 선택할 수 있도록 합니다.
import React from "react";
import "../styles/StationSelector.css";

interface Props {
    // [LLM] 선택 가능한 역 이름 리스트입니다.
    stations: string[];
    // [LLM] 역 선택 시 호출되는 콜백 함수입니다.
    onSelect: (station: string) => void;
}

// [LLM] 역 선택 UI를 표시하는 StationSelector 컴포넌트입니다.
const StationSelector: React.FC<Props> = ({ stations, onSelect }) => {
    return (
        // [LLM] 팝업 전체 영역입니다.
        <div className="station-popup">
            {/* [LLM] 팝업 상단에 표시되는 제목 텍스트입니다. */}
            <div className="station-popup-title">역명</div>

            {/* [LLM] 역 버튼들을 그리드 형태로 배치합니다. */}
            <div className="station-grid">
                {stations.map((station) => (
                    // [LLM] 각각의 역에 대한 버튼입니다. 클릭 시 해당 역 이름을 상위 컴포넌트로 전달합니다.
                    <button
                        key={station}
                        id="station-button"
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
