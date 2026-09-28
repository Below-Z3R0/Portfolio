export function Title4({ txt, className, }: {
txt: string;
className?: string;
}) {
    return (
        <h4
            className={`text-lg text-wrap: balance tracking-tight text-left ${className} `}
        >
            {txt}
        </h4>
    );
}
