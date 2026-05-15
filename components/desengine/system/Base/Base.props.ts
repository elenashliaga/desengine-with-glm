import { ReactNode } from "react";

// Набор свойств, типичный для компонента
// Используется через пересечение: ComponentProps = BaseProps & { … }
type BaseProps = {
    title?: number | string;
    className?: string;
    children?: ReactNode;
}

export { type BaseProps }