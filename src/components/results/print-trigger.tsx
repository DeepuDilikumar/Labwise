"use client";
import { Printer } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

export function PrintTrigger({ label, hint }: { label: string; hint: string }) {
  React.useEffect(() => {
    const id = setTimeout(() => window.print(), 600);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-[14px] bg-[#e5f2ed] p-3 print:hidden">
      <p className="text-small text-[#0a5c4b]">{hint}</p>
      <Button size="sm" onClick={() => window.print()}>
        <Printer aria-hidden /> {label}
      </Button>
    </div>
  );
}
