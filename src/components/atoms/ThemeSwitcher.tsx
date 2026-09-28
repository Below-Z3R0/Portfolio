"use client";
import { useState } from "react";
import { Button } from "../components";
import { useTheme } from "../hooks/useTheme";

// Tipo restringido para los themes que next-themes acepta via setTheme
type ThemeOption = "light" | "dark";

type ThemeSwitcherProps = {
    ThemeMenuOrganization?: string;
    theme_data: string[];
};

export function ThemeSwitcher({
    ThemeMenuOrganization,
    theme_data,
}: ThemeSwitcherProps) {
    const { setTheme } = useTheme();
    const [
        isOpen,
        setIsOpen,
    ] = useState<boolean>(false);
    return (
        <>
            <Button
                svg={"daynight"}
                buttonBody="size-7 z-50 "
                svgStyle="text-main hover:text-accent"
                onClick={() => setIsOpen(!isOpen)}
            />

            {isOpen && (
                <div
                    className={`-z-10 mt-32 ml-70 mx-auto fixed w-40 rounded-md p-2 gap-2 flex flex-col items-end bg-page border border-border-subtle shadow-2xl ${ThemeMenuOrganization ?? ""}`}
                >
                    {theme_data.map((cat, index) => (
                        <Button
                            onClick={() => setTheme(cat as ThemeOption)}
                            key={index}
                            txt={cat}
                            buttonBody="flex items-start h-8 w-full p-1 rounded-md"
                            txtStyle="hover:text-accent"
                        />
                    ))}
                </div>
            )}
        </>
    );
}
