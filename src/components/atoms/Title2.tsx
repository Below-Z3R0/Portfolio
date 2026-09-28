import { TitleProps } from "../types";

export function Title2({ txt, className, }: TitleProps) {
    return (
        <h2
            className={`text-4xl text-wrap: balance tracking-tight text-left text-main ${className}`}
        >
            {txt}
        </h2>
    );
}
