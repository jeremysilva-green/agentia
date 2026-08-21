import type { Database } from "@/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AgentProfile = Database["public"]["Tables"]["agent_profiles"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type PropertyImage = Database["public"]["Tables"]["property_images"]["Row"];
export type AffiliateLink = Database["public"]["Tables"]["affiliate_links"]["Row"];
export type LeadEvent = Database["public"]["Tables"]["lead_events"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type ChatConversation = Database["public"]["Tables"]["chat_conversations"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type AgentRating = Database["public"]["Tables"]["agent_ratings"]["Row"];
export type ClientRequest = Database["public"]["Tables"]["client_requests"]["Row"];
export type PrivateAgreement = Database["public"]["Tables"]["private_agreements"]["Row"];
export type AgentAvailability = Database["public"]["Tables"]["agent_availability"]["Row"];
export type Agendamiento = Database["public"]["Tables"]["agendamientos"]["Row"];
export type ShortLink = Database["public"]["Tables"]["short_links"]["Row"];
export type PanelSectionView = Database["public"]["Tables"]["panel_section_views"]["Row"];
export type PanelSection = PanelSectionView["section"];

export type AgentCardData = AgentProfile & {
  profile: Pick<Profile, "username" | "full_name" | "avatar_url">;
  available_count: number;
  sold_count: number;
  rating_avg: number;
  rating_count: number;
};

export type PropertyWithImages = Property & {
  property_images: PropertyImage[];
};

export type LeadPipelineRow = Lead & {
  property_title: string;
  property_price: number;
  property_currency: string;
  affiliate_username: string | null;
};

export type AffiliateLeadRow = Lead & {
  property_title: string;
  agent_name: string;
  agent_phone: string | null;
};

export type AgentChatRow = ChatConversation & {
  property_title: string;
};

export type AgendamientoRow = Agendamiento & {
  property_title: string;
};

export type AffiliateLinkRow = AffiliateLink & {
  property_title: string;
  property_city: string;
  property_price: number;
  property_currency: string;
  property_status: Property["status"];
  property_listing_type: Property["listing_type"];
  agent_slug: string;
  view_count: number;
  lead_count: number;
  short_code: string | null;
};

// A property the affiliate promoted that's now sold. Commission fields are
// only populated when the sale went through a tracked referral lead closed
// via "Trato cerrado" — a property can also be marked sold directly from the
// property form with no lead involved, in which case there's no commission.
export type AffiliateSaleNotice = {
  id: string;
  property_id: string;
  property_title: string;
  sold_at: string | null;
  agent_name: string;
  agent_phone: string | null;
  commission_amount: number;
  commission_is_estimate: boolean;
  commission_paid_at: string | null;
  report_path: string | null;
};
