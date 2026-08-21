"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button size="sm" onClick={() => window.print()} className="print:hidden">
      <Printer size={15} />
      Imprimir
    </Button>
  );
}
