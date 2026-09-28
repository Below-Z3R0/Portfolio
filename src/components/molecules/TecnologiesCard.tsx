import { IconRender } from "../atoms/IconRender";
import { Title3, Title4 } from "../components";
import type { TecnologiesConfig } from "../types";

export function TecnologiesCard({
  name,
  svg,
  color,
  cardStyle,
  iconStyle,
  bar,
}: TecnologiesConfig) {
  return (
    <div
      style={{ "--tech-color": color } as React.CSSProperties}
      className={`w-34 group relative flex flex-col items-center justify-center p-4 bg-primary-container backdrop-blur-xs border border-border rounded-3xl transition-all duration-300 hover:-translate-y-2 shadow-xl hover:bg-(--tech-color)/5 ${cardStyle}`}
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-65 transition-opacity rounded-3xl blur-3xl bg-(--tech-color)`}
      />

      <div
        className={`mb-3 group-hover:scale-110 transition-transform duration-300 ${iconStyle}`}
      >
        {svg && (
          <IconRender
            name={svg}
            className={`size-full text-(--tech-color) filter drop-shadow-[0_0_12px_var(--tech-color)]/50`}
          />
        )}
      </div>

      {name && (
        <Title4 className="transition-colors" txt={name}/>
      )}

      {bar && (
        <div
          className={`absolute bottom-0 h-1 w-0 group-hover:w-1/2 transition-all duration-500 rounded-full bg-(--tech-color)`}
        />
      )}
    </div>
  );
}
