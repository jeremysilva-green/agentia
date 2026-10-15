"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type TypologyRow = {
  name: string;
  bedrooms: string;
  areaM2: string;
  priceFrom: string;
  unitsAvailable: string;
};

const emptyRow: TypologyRow = { name: "", bedrooms: "", areaM2: "", priceFrom: "", unitsAvailable: "" };

// Repeatable "Tipologías" table for Proyecto en Pozo listings — each row
// emits four parallel hidden inputs (same name across rows, read
// server-side via formData.getAll() zipped by index), the same convention
// already used for negotiationType's repeated hidden inputs.
export function TypologyEditor({ defaultRows = [] }: { defaultRows?: TypologyRow[] }) {
  const [rows, setRows] = useState<TypologyRow[]>(defaultRows.length > 0 ? defaultRows : [emptyRow]);

  function updateRow(index: number, field: keyof TypologyRow, value: string) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-slate-700">Tipologías</p>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-3 sm:items-end md:grid-cols-6">
          <input type="hidden" name="typologyName" value={row.name} />
          <input type="hidden" name="typologyBedrooms" value={row.bedrooms} />
          <input type="hidden" name="typologyAreaM2" value={row.areaM2} />
          <input type="hidden" name="typologyPriceFrom" value={row.priceFrom} />
          <input type="hidden" name="typologyUnitsAvailable" value={row.unitsAvailable} />
          <Input
            id={`typologyName-${i}`}
            label="Tipología"
            value={row.name}
            onChange={(e) => updateRow(i, "name", e.target.value)}
            placeholder="2 dormitorios"
            className="bg-white! col-span-2 sm:col-span-1"
          />
          <Input
            id={`typologyBedrooms-${i}`}
            type="number"
            min="0"
            label="Dorm."
            value={row.bedrooms}
            onChange={(e) => updateRow(i, "bedrooms", e.target.value)}
            className="bg-white!"
          />
          <Input
            id={`typologyAreaM2-${i}`}
            type="number"
            min="0"
            label="m²"
            value={row.areaM2}
            onChange={(e) => updateRow(i, "areaM2", e.target.value)}
            className="bg-white!"
          />
          <Input
            id={`typologyPriceFrom-${i}`}
            type="number"
            min="0"
            label="Precio desde"
            value={row.priceFrom}
            onChange={(e) => updateRow(i, "priceFrom", e.target.value)}
            className="bg-white!"
          />
          <Input
            id={`typologyUnitsAvailable-${i}`}
            type="number"
            min="0"
            label="Disponibles"
            value={row.unitsAvailable}
            onChange={(e) => updateRow(i, "unitsAvailable", e.target.value)}
            className="bg-white!"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => removeRow(i)}
            disabled={rows.length === 1}
            className="col-span-2 h-10 sm:col-span-3 md:col-span-1"
          >
            <Trash2 size={14} />
            <span className="sm:hidden">Eliminar tipología</span>
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setRows((prev) => [...prev, { ...emptyRow }])}
        className="self-start"
      >
        <Plus size={14} />
        Agregar tipología
      </Button>
    </div>
  );
}
