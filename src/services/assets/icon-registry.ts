import { z } from "zod";
import {
  AlertCircleIcon,
  DayAndNightIcon,
  DockerIcon,
  FigmaIcon,
  GitHubIcon,
  GitIcon,
  HamburNavIcon,
  HomeIcon,
  HTML5Icon,
  LanguageIcon,
  LinkedInIcon,
  MailIcon,
  NextIcon,
  NodeIcon,
  PostGresSQLIcon,
  ReactIcon,
  RefreshCwIcon,
  SupaBaseIcon,
  TailwindIcon,
  TypeScriptIcon,
} from "@/services/assets/Icons";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export const ICON_REGISTRY = {
  react: ReactIcon,
  docker: DockerIcon,
  node: NodeIcon,
  supabase: SupaBaseIcon,
  typescript: TypeScriptIcon,
  tailwind: TailwindIcon,
  postgressql: PostGresSQLIcon,
  figma: FigmaIcon,
  html5: HTML5Icon,
  github: GitHubIcon,
  git: GitIcon,
  next: NextIcon,
  hamburnav: HamburNavIcon,
  language: LanguageIcon,
  linkedin: LinkedInIcon,
  mail: MailIcon,
  daynight: DayAndNightIcon,
  alert_circle: AlertCircleIcon,
  refresh_cw: RefreshCwIcon,
  home: HomeIcon,
} as const satisfies Record<string, IconComponent>;

export const IconNameSchema = z
  .string()
  .refine(
    (val) => val in ICON_REGISTRY,
    {
      message:
        "Debe ser una key del registry (react, docker...)",
    },
  );

// Helper para usar en componentes
export type IconKey = keyof typeof ICON_REGISTRY;
