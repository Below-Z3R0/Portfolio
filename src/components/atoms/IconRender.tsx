import type { IconRendererProps } from "../types";
import { ICON_REGISTRY } from "../../services/assets/icon-registry";

export function IconRender({ name, className, }: IconRendererProps) {
    // Key válida del registry → componente inline
    const InlineComponent = ICON_REGISTRY[name as keyof typeof ICON_REGISTRY];

    if (InlineComponent) {
        return <InlineComponent className={className} />;
    }

    // Fallback: no se puede renderizar
    return null;
}
