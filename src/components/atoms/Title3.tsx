export function Title3({ txt, className, }: {
txt: string;
className?: string;
}) {
    return (
        <h3
            className={` text-wrap: balance tracking-tight text-left text-xl text-accent uppercase ${className}`}
        >
            {txt}
        </h3>
    );
}
