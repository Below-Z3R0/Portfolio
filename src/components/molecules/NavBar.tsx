import { NoiseTexture } from "@/services/assets/Icons";
import { ThemeSwitcher } from "../atoms/ThemeSwitcher";
import { LanguageToggle, LinkButton, Title3, Title4 } from "../components";
import type { NavBarProps } from "../types";

export function NavBar({
    nav_data,
    GeneralOrganization,
    LinksOrganization,
    ThemeMenuOrganization,
    name,
}: NavBarProps) {
    return (
        <nav
            className={`z-20 qw:left-5 qw:right-5 left-2 right-2 max-w-232 p-5 mt-1 rounded-2xl fixed mx-auto flex gap-6 items-center justify-between bg-page/80 backdrop-blur-xl border border-border-subtle shadow-2xl ${GeneralOrganization ?? ""}`}
        >
            <NoiseTexture className="bg-fx__noise opacity-100" />
            {name && <Title4 txt="Emmanuel.Dev" className="text-main"/>}
            <div className={`flex gap-4 items-center ${LinksOrganization ?? ""}`}>
                {nav_data.data.map((item) => (
                    <LinkButton
                        key={item.id}
                        link={item.link}
                        txt={item.name}
                        txtStyle="hover:text-accent transition-colors text-sm"
                    />
                ))}
                <LanguageToggle />
                <ThemeSwitcher
                    ThemeMenuOrganization={ThemeMenuOrganization}
                    theme_data={nav_data.meta.themes}
                />
            </div>
        </nav>
    );
}
