"use client";
import { useState } from "react";
import {
  Button,
  LinkButton,
  Paragraph,
  TecnologiesCard,
  Title2,
  Title4,
} from "../components";
import type { ProjectCardProps } from "../types";

export function ProjectCard({ project_data, labels_data }: ProjectCardProps) {
  const [activeTxt, setActivetxt] = useState(project_data.data.paragraph);
  const handleReset = () => setActivetxt(project_data.data.paragraph);
  const in_construction = project_data.meta.is_in_construction
    ? "opacity-65 cursor-not-allowed pointer-events-none"
    : "";

  return (
    <article
      className={`${project_data.meta.image_key !== undefined ? "max-h-220" : "qw:max-w-[47.9%] max-h-120"} mx-auto qw:h-90 w-full h-auto rounded-xl flex qw:flex-row flex-col-reverse justify-between p-5 bg-card border border-border shadow-lg transition-all ${project_data.meta.is_in_construction ? "hover:ring-1 hover:ring-destructive" : "hover:border-ring"}`}
    >
      <div
        className={`${project_data.meta.image_key === undefined ? "" : "qw:w-[50%] "} h-full w-full flex flex-col mt-3 qw:mt-0 items-start gap-1`}
      >
        {project_data.meta.is_relevant && (
          <Title4
            className="w-40 h-10 rounded-xl flex justify-center items-center bg-primary-soft text-primary text-[10px] font-bold uppercase ring-1 ring-primary/40"
            txt={labels_data.featured}
          />
        )}

        {project_data.meta.is_in_construction && (
          <Title4
            className="w-40 h-10 rounded-xl flex justify-center items-center bg-warning-soft text-warning text-[10px] font-bold uppercase ring-1 ring-warning/40"
            txt={labels_data.in_construction}
          />
        )}

        <Title2
          txt={project_data.meta.title}
          className="text-primary/80! mt-1 text-3xl!"
        />

        <Paragraph
          className="h-full text-[0.97rem]!"
          txt={activeTxt}
        />

        <div className="flex flex-col gap-2 w-full">
          {/* Links GitHub / Live Demo — ahora con underline + iconos */}
          <div className="flex justify-start gap-3 mt-5">
            <LinkButton
              txtStyle={`text-sm hover:text-primary ${in_construction}`}
              txt="Live Demo"
              link={project_data.meta.link_live_demo}
            />
            <LinkButton
              txtStyle={`text-sm hover:text-primary ${in_construction}`}
              txt="GitHub"
              link={project_data.meta.link_github}
            />
            <span className="text-muted-foreground">·</span>
          </div>

          <div className="w-full flex justify-between items-center gap-3 mt-2">
            {/* Tech icons más grandes (size-10) con label visible */}
            <div className="flex">
              {project_data.data.tecnologies.map((item, index) => (
                <Button
                  buttonBody={`size-10 cursor-pointer ${in_construction}`}
                  onClick={() => setActivetxt(item.description)}
                  key={index}
                  aria-label={item.name}
                >
                  <TecnologiesCard
                    cardStyle="bg-transparent! border-none! rounded-none! p-0! h-12! w-8! shadow-none!"
                    svg={item.icon_key}
                    color={item.color}
                    bar={true}
                  />
                </Button>
              ))}
            </div>
            {/* Return button — más claro, siempre visible */}
            <Button
              buttonBody={`cursor-pointer h-9 px-4 rounded-full bg-popover border border-border transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] ${in_construction}`}
              txtStyle="text-[11px] font-bold uppercase tracking-widest"
              txt="↺ Reset"
              onClick={handleReset}
            />
          </div>
        </div>
      </div>

      {project_data.meta.image_key && (
        <LinkButton
          buttonBody={`qw:w-[47.9%] qw:h-full h-auto object- rounded-xl overflow-hidden  transition-all duration-300 cursor-pointer border border-primary ${in_construction}`}
          link={project_data.meta.link_live_demo ?? "#"}
          img={project_data.meta.image_key}
          imgStyle="object-cover mask-x-to-r"
        />
      )}
    </article>
  );
}