import { DAY_OF_WEEK_LABELS } from "@/lib/constants/dayOfWeek";
import { AgendamientoStatusSelect } from "@/components/panel/AgendamientoStatusSelect";
import { copy } from "@/lib/copy";
import type { AgendamientoRow } from "@/types/domain";

function dateFmt(value: string) {
  return new Date(value).toLocaleDateString("es-PY", { day: "2-digit", month: "short", year: "numeric" });
}

export function AgendamientosTable({ rows }: { rows: AgendamientoRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {copy.panel.agendamientosEmpty}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.agendamientosClient}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.agendamientosProperty}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.agendamientosSchedule}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.agendamientosStatus}</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">{copy.panel.chatDate}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="whitespace-nowrap px-4 py-3">
                <p className="font-medium text-slate-900">{row.client_name}</p>
                <p className="text-slate-500">{row.client_phone}</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.property_title}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {DAY_OF_WEEK_LABELS[row.day_of_week]} {row.start_time.slice(0, 5)}–{row.end_time.slice(0, 5)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <AgendamientoStatusSelect agendamientoId={row.id} status={row.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">{dateFmt(row.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
