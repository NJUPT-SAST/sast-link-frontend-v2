"use client";

import { useEffect, useMemo, useState } from "react";
import projects from "@/content/projects.json";

interface Project { name: string; github_url?: string; url?: string }
const projectList = projects as Project[];
const ASCII_RAMP = " .·:;+=*#%@";
function hashSeed(value: string) {
  return [...value].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}
function createAsciiField(name: string, index: number) {
  const seed = hashSeed(`${name}:${index}`);
  const cols = 88;
  const rows = 30;
  return Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => {
    const nx = x / cols;
    const ny = y / rows;
    const wave = Math.sin(nx * 8.7 + seed * 0.000013) * Math.cos(ny * 7.1 - seed * 0.000009);
    const grain = Math.sin((x * 12.9898 + y * 78.233 + seed) * 0.021) * 0.18;
    const value = (wave + grain + 1) / 2;
    return ASCII_RAMP[Math.min(ASCII_RAMP.length - 1, Math.floor(value * ASCII_RAMP.length))];
  }).join("")).join("\n");
}
function mod(value: number, length: number) { return (value + length) % length; }
function AsciiBackdrop({ name, index }: { name: string; index: number }) {
  return <pre aria-hidden className="pointer-events-none absolute inset-0 m-0 overflow-hidden p-0 text-[10px] leading-[1.12] tracking-[0.04em] text-foreground opacity-[0.12] select-none sm:text-[11px]">{createAsciiField(name, index)}</pre>;
}
function ProjectCard({ project, index, position, onSelect }: { project: Project; index: number; position: "previous" | "active" | "next" | "hidden"; onSelect: () => void }) {
  const transform = position === "active"
    ? "translate(-50%, -50%) scale(1)"
    : position === "previous"
      ? "translate(calc(-50% - clamp(150px, 34vw, 250px)), calc(-50% + clamp(32px, 4vw, 44px))) scale(.56)"
      : position === "next"
        ? "translate(calc(-50% + clamp(150px, 34vw, 250px)), calc(-50% + clamp(32px, 4vw, 44px))) scale(.56)"
        : "translate(-50%, -50%) scale(.56)";
  return <article aria-hidden={position !== "active"} onClick={position === "active" ? undefined : onSelect} style={{ transform, opacity: position === "active" ? 1 : position === "hidden" ? 0 : 0.45, filter: position === "active" ? "blur(0) saturate(1)" : "blur(.6px) saturate(.45)", zIndex: position === "active" ? 30 : position === "hidden" ? 0 : 10, pointerEvents: position === "hidden" ? "none" : "auto", cursor: position === "active" ? "default" : "pointer" }} className="absolute left-1/2 top-1/2 h-[260px] w-[min(480px,60vw)] overflow-hidden border border-hairline bg-card shadow-[0_0_1px_color-mix(in_srgb,var(--foreground)_45%,transparent)] transition-[transform,opacity,filter] duration-700 ease-out will-change-[transform,opacity,filter] max-sm:h-[145px] max-sm:w-[58vw]">
    <AsciiBackdrop name={project.name} index={index} />
    <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center sm:p-9"><h3 data-cursor-target={position === "active" || undefined} className="inline-block w-fit max-w-[85%] text-[clamp(20px,4vw,46px)] font-semibold leading-none tracking-[-0.06em]">{project.name}</h3><div className="mt-auto flex gap-5 font-mono text-[11px] font-medium uppercase tracking-[0.1em]">{project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer" className="border-b border-foreground pb-1 hover:opacity-60">GitHub ↗</a>}{project.url && <a href={project.url} target="_blank" rel="noreferrer" className="border-b border-foreground pb-1 hover:opacity-60">Visit ↗</a>}</div></div>
  </article>;
}
export function ProjectsCarousel() {
  const [active, setActive] = useState(0); const [paused, setPaused] = useState(false); const [restartToken, setRestartToken] = useState(0); const count = projectList.length;
  const positions = useMemo(() => projectList.map((_, index) => index === active ? "active" as const : index === mod(active - 1, count) ? "previous" as const : index === mod(active + 1, count) ? "next" as const : "hidden" as const), [active, count]);
  useEffect(() => { if (paused || count < 2) return; const timer = setInterval(() => setActive(current => mod(current + 1, count)), 3000); return () => clearInterval(timer); }, [paused, count, restartToken]);
  if (!count) return null;
  return <section aria-label="About SAST's projects" className="flex min-h-screen snap-start flex-col justify-center px-5 py-20 sm:px-8"><div className="mx-auto w-full max-w-6xl"><h2 data-cursor-target className="type-title1 mb-10 inline-block text-foreground/65">About SAST&apos;s projects</h2><div className="relative h-[390px] max-sm:h-[250px]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>{projectList.map((project, index) => <ProjectCard key={`${project.name}-${index}`} project={project} index={index} position={positions[index]} onSelect={() => { setActive(index); setRestartToken(token => token + 1); }} />)}</div><div className="relative z-40 flex justify-center gap-2" aria-label="Choose a project">{projectList.map((project, index) => <button key={project.name} type="button" aria-label={`查看 ${project.name}`} aria-current={index === active} data-cursor-target onClick={() => { setActive(index); setRestartToken(token => token + 1); }} className="size-2.5 rounded-[1px] border border-muted-foreground transition-colors hover:border-foreground aria-[current=true]:border-foreground aria-[current=true]:bg-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50" />)}</div></div></section>;
}
