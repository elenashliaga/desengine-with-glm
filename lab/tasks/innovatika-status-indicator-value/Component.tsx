import React from "react";
import { StatusBoxProps } from "./props";
import { styles } from "./styles";

const statusOrder: StatusBoxProps["status"][] = ["normal", "elevated", "high"];

const statusTextMap: Record<string, string> = {
    normal: "Давление в норме",
    elevated: "Повышенное давление",
    high: "Высокое давление"
};

const statusStyleMap: Record<string, React.CSSProperties> = {
    normal: styles.normal,
    elevated: styles.elevated,
    high: styles.high
};

const StatusBox: React.FC<StatusBoxProps> = ({ status }) => {
    const statusesToRender = status === "all" ? statusOrder : [status];

    return (
        <div style={styles.group}>
            {statusesToRender.map((item, index) => {
                const currentStyle = statusStyleMap[item] || styles.default;
                const currentText = statusTextMap[item] || "Неизвестное состояние";

                return (
                    <div key={`${item}-${index}`} style={{ ...styles.container, ...currentStyle }}>
                        {currentText}
                    </div>
                );
            })}
        </div>
    );
};

export default StatusBox;
