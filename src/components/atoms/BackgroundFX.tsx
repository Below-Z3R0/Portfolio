import { NoiseTexture } from "@/services/assets/Icons";

export function BackgroundFX() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none overflow-hidden"
    >

      {/* Grid de patrón */}
      <div className="absolute inset-0 bg-grid" />


      {/* Noise fuerte */}
      <NoiseTexture className="bg-fx__noise" />

      {/* Vignette */}
      <div className="bg-fx__vignette" />
    </div>
  );
}