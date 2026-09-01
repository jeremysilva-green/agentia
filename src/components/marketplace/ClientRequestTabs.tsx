"use client";

import { useState } from "react";
import { Home, Search } from "lucide-react";
import { ClientRequestModal } from "@/components/marketplace/ClientRequestModal";
import { copy } from "@/lib/copy";
import type { ClientRequestKind } from "@/lib/constants/clientRequests";

export function ClientRequestTabs({ agentId }: { agentId: string }) {
  const [openModal, setOpenModal] = useState<ClientRequestKind | null>(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpenModal("comprador")}
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Search size={12} />
          {copy.clientRequest.tabComprador}
        </button>
        <button
          type="button"
          onClick={() => setOpenModal("vendedor")}
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Home size={12} />
          {copy.clientRequest.tabVendedor}
        </button>
      </div>

      {openModal && <ClientRequestModal kind={openModal} agentId={agentId} onClose={() => setOpenModal(null)} />}
    </>
  );
}
