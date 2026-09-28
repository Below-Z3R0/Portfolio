"use client";
import { useState } from "react";
import { Button, NavBar, Title1, Title2, Title3 } from "../components";
import type { NavBarProps } from "../types";

type HeaderProps = {
  nav_data: NavBarProps["nav_data"];
};

export function Header({
  nav_data,
}: HeaderProps) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);
  return (
    <header>
      <NavBar
        nav_data={nav_data}
        name={true}
        GeneralOrganization="hidden ew:flex"
      />

      <nav
        aria-label="Navegación móvil"
        className="z-1 qw:left-5 qw:right-5 left-2 right-2 max-w-241.5 p-5 mt-5 rounded-2xl mx-auto flex gap-6 items-center justify-between ew:hidden"
      >
        <div className="flex fixed w-full justify-end mx-auto pr-10 z-1">
          <Button
            svg={"hamburnav"}
            buttonBody="size-7 "
            svgStyle="text-main"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
          />
        </div>
      </nav>

      {isOpen && (
        <div className="fixed top-20 right-4 z-50 ew:hidden">
          <NavBar
            nav_data={nav_data}
            GeneralOrganization="flex-col! items-end! bg-page/95! backdrop-blur-xl! border! border-border-subtle! rounded-2xl! shadow-2xl! gap-2! p-3! static! max-w-48!"
            LinksOrganization="flex! flex-col! items-end! gap-2!"
            ThemeMenuOrganization="right-0! top-0! relative! ml-0! mt-2! w-full!"
          />
        </div>
      )}
    </header>
  );
}
