import Link from "next/link";
import type { ReactNode } from "react";

export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}
    >
      {name[0]}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-neutral-200 bg-white p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Pill({
  tone,
  children,
}: {
  tone: "green" | "amber" | "red" | "gray";
  children: ReactNode;
}) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-bni-soft text-bni-dark",
    gray: "bg-neutral-100 text-neutral-500",
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mt-5 mb-2.5 text-base font-bold first:mt-1">{children}</h2>;
}

export function BackLink({ href, label = "返回" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="mb-3 inline-block text-sm font-bold text-bni">
      ‹ {label}
    </Link>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-1 py-2 text-sm text-neutral-500">{children}</p>;
}
