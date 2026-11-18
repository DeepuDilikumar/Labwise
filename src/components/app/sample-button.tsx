"use client";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { startSample } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";

export function SampleButton({ label, className }: { label: string; className?: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant="secondary"
      className={className}
      loading={pending}
      onClick={() =>
        start(async () => {
          const r = await startSample();
          if (r.ok) router.push(`/reports/${r.id}`);
        })
      }
    >
      <Sparkles aria-hidden /> {label}
    </Button>
  );
}
