export function Paragraph({ txt, className, }: {
txt: string | undefined;
className?: string;
}) {
    return (
        <p className={`${className ?? ""} text-left text-lg leading-relaxed text-muted-foreground whitespace-pre-line`}>{txt}</p>
    );
}
