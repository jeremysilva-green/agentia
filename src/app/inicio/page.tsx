import { redirect } from "next/navigation";

// The landing page moved to "/" — this stub just catches anyone who still
// has /inicio bookmarked or shared from before the move.
export default function InicioRedirect() {
  redirect("/");
}
