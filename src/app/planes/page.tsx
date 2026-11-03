import type { Metadata } from "next";
import { PlansSection } from "@/components/landing/PlansSection";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: `Planes | ${copy.brand}`,
  description: "Empezá gratis y crecé cuando quieras. Conocé los planes Básico, Pro, Fundador y MLS de Agentia.",
};

export default function PlanesPage() {
  return <PlansSection standalone />;
}
