"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { Dict } from "@/lib/i18n";

/**
 * 4-step onboarding for active (non-expired) students (PRD §9.3). Skip marks it
 * done; Finish shows a success toast. Completion is remembered in a cookie so it
 * doesn't reappear. Expired/blocked students never receive `initialShow`.
 */
export function StudentOnboarding({ t, initialShow }: { t: Dict; initialShow: boolean }) {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(initialShow);
  const [toast, setToast] = useState(false);

  const steps = [
    { title: t.obTitle1, desc: t.obDesc1 },
    { title: t.obTitle2, desc: t.obDesc2 },
    { title: t.obTitle3, desc: t.obDesc3 },
    { title: t.obTitle4, desc: t.obDesc4 },
  ];
  const last = step === steps.length - 1;

  function done(finished: boolean) {
    document.cookie = "cikgu_onboarded=1; path=/; max-age=31536000; samesite=lax";
    setShow(false);
    if (finished) {
      setToast(true);
      setTimeout(() => setToast(false), 2800);
    }
  }

  if (toast) {
    return (
      <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-[5px] bg-chalk px-4 py-2 text-sm font-medium text-white shadow">
        {t.obDone}
      </div>
    );
  }
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-sm rounded-[5px] border border-rule bg-card p-6 shadow-lg">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
          {step + 1} / {steps.length}
        </p>
        <h2 className="mt-2 font-display text-xl font-bold text-ink">{steps[step].title}</h2>
        <p className="mt-2 text-sm text-ink-soft">{steps[step].desc}</p>

        <div className="mt-4 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${i === step ? "bg-ink" : "bg-rule"}`}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button onClick={() => done(false)} className="text-sm font-medium text-ink-soft hover:text-ink">
            {t.obSkip}
          </button>
          <Button onClick={() => (last ? done(true) : setStep(step + 1))}>
            {last ? t.obFinish : t.obNext}
          </Button>
        </div>
      </div>
    </div>
  );
}
