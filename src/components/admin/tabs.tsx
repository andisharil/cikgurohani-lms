"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export function Tabs({ tabs }: { tabs: { key: string; label: string; node: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div className="flex gap-1 border-b border-rule">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              active === t.key
                ? "border-marker text-ink"
                : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="py-5">{current?.node}</div>
    </div>
  );
}
