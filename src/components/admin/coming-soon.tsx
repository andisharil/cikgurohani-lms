import { EmptyState } from "@/components/ui";

export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      <EmptyState
        title="Modul ini dalam pembinaan"
        description={note ?? "Skema dan kebenaran telah siap; antara muka akan menyusul."}
      />
    </div>
  );
}
