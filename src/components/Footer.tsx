import Link from "next/link";
import { MessageCircle } from "lucide-react";

function InstagramIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const links = [
  { href: "/que-es-agentia", label: "¿Qué es Agentia?" },
  { href: "/ranking-afiliados", label: "Ranking de Afiliados" },
  { href: "/privacidad", label: "Política de Privacidad" },
  { href: "/terminos", label: "Términos de Servicio" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-emerald-600/40 bg-black">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <a
            href="https://chat.whatsapp.com/BahpSvfmwIGLj7fSkAGijz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-emerald-400"
          >
            <MessageCircle size={15} />
            Comunidad WhatsApp
          </a>

          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-emerald-400"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-emerald-500 hover:text-emerald-400"
          >
            <InstagramIcon size={16} />
          </a>
          <span className="text-xs text-white/40">© {year} AGENTIA</span>
        </div>
      </div>
    </footer>
  );
}
