"use client";

import { Button } from "@/components/ui";

/** Triggers the browser's print/"Save as PDF" dialog. Hidden when printing. */
export function PrintButton({ label = "Cetak / Simpan PDF" }: { label?: string }) {
  return (
    <Button className="no-print" onClick={() => window.print()}>
      {label}
    </Button>
  );
}
