// Hand-written to match supabase/migrations/*.sql.
// Once you can run `supabase start`, regenerate with:
//   supabase gen types typescript --local > src/types/database.types.ts

import type { PropertyType } from "@/lib/constants/propertyTypes";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "agent" | "user";
          username: string;
          alias: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          terms_accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: "agent" | "user";
          username: string;
          alias?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          terms_accepted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      agent_profiles: {
        Row: {
          id: string;
          slug: string;
          bio: string | null;
          city: string | null;
          cover_image_url: string | null;
          is_active: boolean;
          pagopar_identificador: number | null;
          pagopar_cliente_creado: boolean;
          tarjeta_guardada: boolean;
          proveedor_tarjeta: "Bancard" | "uPay" | "dLocal" | null;
          bancard_alias_token: string | null;
          dlocal_network_payment_reference: string | null;
          dlocal_transaction_link_id: string | null;
          dlocal_card_last4: string | null;
          dlocal_recurring_supported: boolean | null;
          ruc: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          bio?: string | null;
          city?: string | null;
          cover_image_url?: string | null;
          is_active?: boolean;
          pagopar_identificador?: number | null;
          pagopar_cliente_creado?: boolean;
          tarjeta_guardada?: boolean;
          proveedor_tarjeta?: "Bancard" | "uPay" | "dLocal" | null;
          bancard_alias_token?: string | null;
          dlocal_network_payment_reference?: string | null;
          dlocal_transaction_link_id?: string | null;
          dlocal_card_last4?: string | null;
          dlocal_recurring_supported?: boolean | null;
          ruc?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_profiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "agent_profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      properties: {
        Row: {
          id: string;
          agent_id: string;
          title: string;
          description: string;
          listing_type: "rent" | "sale";
          property_type: PropertyType | null;
          price: number;
          currency: string;
          price_includes_iva: boolean;
          city: string;
          address: string | null;
          lat: number | null;
          lng: number | null;
          maps_url: string | null;
          status: "available" | "sold" | "rented" | "draft";
          published: boolean;
          bedrooms: number | null;
          bathrooms: number | null;
          area_m2: number | null;
          garage: boolean;
          negotiation_type: string[];
          negotiation_details: string | null;
          sold_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          title: string;
          description: string;
          listing_type: "rent" | "sale";
          property_type?: PropertyType | null;
          price: number;
          currency?: string;
          price_includes_iva?: boolean;
          city: string;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          maps_url?: string | null;
          status?: "available" | "sold" | "rented" | "draft";
          published?: boolean;
          bedrooms?: number | null;
          bathrooms?: number | null;
          area_m2?: number | null;
          garage?: boolean;
          negotiation_type?: string[];
          negotiation_details?: string | null;
          sold_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          storage_path: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          storage_path: string;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["property_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      affiliate_links: {
        Row: {
          id: string;
          property_id: string;
          user_id: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          user_id: string;
          slug?: string;
        };
        Update: Partial<Database["public"]["Tables"]["affiliate_links"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "affiliate_links_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "affiliate_links_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_events: {
        Row: {
          id: string;
          affiliate_link_id: string | null;
          property_id: string;
          event_type: "view" | "whatsapp_click";
          visitor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          affiliate_link_id?: string | null;
          property_id: string;
          event_type: "view" | "whatsapp_click";
          visitor_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lead_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lead_events_affiliate_link_id_fkey";
            columns: ["affiliate_link_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_events_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      portfolio_views: {
        Row: {
          id: string;
          agent_id: string;
          visitor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          visitor_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["portfolio_views"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "portfolio_views_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          id: string;
          referral_code: string;
          property_id: string | null;
          agent_id: string;
          affiliate_link_id: string | null;
          client_request_id: string | null;
          buyer_name: string;
          buyer_phone: string;
          status: "new" | "contacted" | "viewing" | "offer" | "negotiation" | "reserved" | "sold";
          referral_date: string;
          protected_until: string;
          sale_price: number | null;
          commission_pct: number | null;
          commission_amount: number | null;
          commission_confirmed_at: string | null;
          commission_paid_at: string | null;
          report_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          referral_code: string;
          property_id?: string | null;
          agent_id: string;
          affiliate_link_id?: string | null;
          client_request_id?: string | null;
          buyer_name: string;
          buyer_phone: string;
          status?: "new" | "contacted" | "viewing" | "offer" | "negotiation" | "reserved" | "sold";
          referral_date?: string;
          protected_until?: string;
          sale_price?: number | null;
          commission_pct?: number | null;
          commission_amount?: number | null;
          commission_confirmed_at?: string | null;
          commission_paid_at?: string | null;
          report_path?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_affiliate_link_id_fkey";
            columns: ["affiliate_link_id"];
            isOneToOne: false;
            referencedRelation: "affiliate_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_client_request_id_fkey";
            columns: ["client_request_id"];
            isOneToOne: false;
            referencedRelation: "client_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_conversations: {
        Row: {
          id: string;
          property_id: string;
          agent_id: string;
          lead_id: string | null;
          visitor_id: string;
          messages: Json;
          summary: string | null;
          buyer_name: string | null;
          buyer_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          agent_id: string;
          lead_id?: string | null;
          visitor_id: string;
          messages?: Json;
          summary?: string | null;
          buyer_name?: string | null;
          buyer_phone?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["chat_conversations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "chat_conversations_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          agent_id: string;
          status: "pending" | "trialing" | "active" | "past_due" | "canceled";
          plan: "basico" | "pro" | "fundador" | null;
          period_start: string | null;
          period_end: string | null;
          trial_ends_at: string | null;
          pagopar_hash_pedido_actual: string | null;
          pagopar_numero_pedido_actual: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          status: "pending" | "trialing" | "active" | "past_due" | "canceled";
          plan?: "basico" | "pro" | "fundador" | null;
          period_start?: string | null;
          period_end?: string | null;
          trial_ends_at?: string | null;
          pagopar_hash_pedido_actual?: string | null;
          pagopar_numero_pedido_actual?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "subscriptions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          subscription_id: string;
          bancard_shop_process_id: string | null;
          bancard_transaction_id: string | null;
          bancard_process_id: string | null;
          bancard_tipo: "checkout" | "recurrente" | "tarjeta" | null;
          pagopar_hash_pedido: string | null;
          pagopar_numero_pedido_comercio: string | null;
          pagopar_comprobante_interno: string | null;
          pagopar_tipo: "checkout" | "recurrente" | null;
          dlocal_payment_id: string | null;
          dlocal_order_id: string | null;
          dlocal_tipo: "primer_pago" | "recurrente" | null;
          amount: number;
          currency: string;
          plan: "basico" | "pro" | "fundador" | null;
          status: "initiated" | "approved" | "rejected" | "error";
          raw_response: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          bancard_shop_process_id?: string | null;
          bancard_transaction_id?: string | null;
          bancard_process_id?: string | null;
          bancard_tipo?: "checkout" | "recurrente" | "tarjeta" | null;
          pagopar_hash_pedido?: string | null;
          pagopar_numero_pedido_comercio?: string | null;
          pagopar_comprobante_interno?: string | null;
          pagopar_tipo?: "checkout" | "recurrente" | null;
          dlocal_payment_id?: string | null;
          dlocal_order_id?: string | null;
          dlocal_tipo?: "primer_pago" | "recurrente" | null;
          amount: number;
          currency?: string;
          plan?: "basico" | "pro" | "fundador" | null;
          status: "initiated" | "approved" | "rejected" | "error";
          raw_response?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_ratings: {
        Row: {
          id: string;
          agent_id: string;
          user_id: string | null;
          visitor_id: string | null;
          rater_key: string | null;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          user_id?: string | null;
          visitor_id?: string | null;
          rating: number;
        };
        Update: Partial<Database["public"]["Tables"]["agent_ratings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "agent_ratings_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      client_requests: {
        Row: {
          id: string;
          agent_id: string;
          kind: "vendedor" | "comprador";
          full_name: string;
          phone: string;
          property_type: PropertyType | null;
          city: string;
          description: string;
          price: number | null;
          price_min: number | null;
          price_max: number | null;
          price_includes_iva: boolean;
          currency: string;
          bedrooms: number | null;
          bathrooms: number | null;
          area_m2: number | null;
          garage: boolean;
          maps_url: string | null;
          negotiation_type: string[];
          negotiation_details: string | null;
          status: "pending" | "approved" | "rejected";
          resulting_property_id: string | null;
          last_reminder_at: string | null;
          last_report_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          kind: "vendedor" | "comprador";
          full_name: string;
          phone: string;
          property_type?: PropertyType | null;
          city: string;
          description: string;
          price?: number | null;
          price_min?: number | null;
          price_max?: number | null;
          price_includes_iva?: boolean;
          currency?: string;
          bedrooms?: number | null;
          bathrooms?: number | null;
          area_m2?: number | null;
          garage?: boolean;
          maps_url?: string | null;
          negotiation_type?: string[];
          negotiation_details?: string | null;
          status?: "pending" | "approved" | "rejected";
          resulting_property_id?: string | null;
          last_reminder_at?: string | null;
          last_report_path?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["client_requests"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "client_requests_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_requests_resulting_property_id_fkey";
            columns: ["resulting_property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      private_agreements: {
        Row: {
          id: string;
          agent_id: string;
          client_request_id: string | null;
          share_code: string;
          status: "pending_owner" | "pending_agent" | "completed";
          agent_name: string | null;
          agent_ruc: string | null;
          agent_phone: string | null;
          agent_email: string | null;
          agent_address: string | null;
          commission: string | null;
          commission_vat_included: boolean | null;
          commission_payment_timing: "reserva" | "cierre" | "otro" | null;
          commission_payment_other: string | null;
          reservation_condition: string | null;
          validity_months: number | null;
          exclusivity: "sin_exclusiva" | "exclusiva" | null;
          auto_renewal: boolean | null;
          agent_signed_at: string | null;
          agent_signed_name: string | null;
          owner1_name: string | null;
          owner1_ci: string | null;
          owner2_name: string | null;
          owner2_ci: string | null;
          owner_phone: string | null;
          owner_email: string | null;
          owner_address: string | null;
          property_type: string | null;
          property_city: string | null;
          property_district: string | null;
          property_address: string | null;
          land_area_m2: number | null;
          built_area_m2: number | null;
          finca_number: string | null;
          padron_number: string | null;
          sale_price: number | null;
          sale_price_words: string | null;
          doc_title: string | null;
          doc_tax: string | null;
          doc_id: string | null;
          doc_other: string | null;
          allow_sign: boolean | null;
          owner_signed_at: string | null;
          owner_signed_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          client_request_id?: string | null;
          share_code?: string;
          status?: "pending_owner" | "pending_agent" | "completed";
          agent_name?: string | null;
          agent_ruc?: string | null;
          agent_phone?: string | null;
          agent_email?: string | null;
          agent_address?: string | null;
          commission?: string | null;
          commission_vat_included?: boolean | null;
          commission_payment_timing?: "reserva" | "cierre" | "otro" | null;
          commission_payment_other?: string | null;
          reservation_condition?: string | null;
          validity_months?: number | null;
          exclusivity?: "sin_exclusiva" | "exclusiva" | null;
          auto_renewal?: boolean | null;
          agent_signed_at?: string | null;
          agent_signed_name?: string | null;
          owner1_name?: string | null;
          owner1_ci?: string | null;
          owner2_name?: string | null;
          owner2_ci?: string | null;
          owner_phone?: string | null;
          owner_email?: string | null;
          owner_address?: string | null;
          property_type?: string | null;
          property_city?: string | null;
          property_district?: string | null;
          property_address?: string | null;
          land_area_m2?: number | null;
          built_area_m2?: number | null;
          finca_number?: string | null;
          padron_number?: string | null;
          sale_price?: number | null;
          sale_price_words?: string | null;
          doc_title?: string | null;
          doc_tax?: string | null;
          doc_id?: string | null;
          doc_other?: string | null;
          allow_sign?: boolean | null;
          owner_signed_at?: string | null;
          owner_signed_name?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["private_agreements"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "private_agreements_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "private_agreements_client_request_id_fkey";
            columns: ["client_request_id"];
            isOneToOne: false;
            referencedRelation: "client_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      panel_section_views: {
        Row: {
          agent_id: string;
          section: "leads" | "solicitudes" | "chats" | "agendamientos" | "acuerdos";
          seen_at: string;
        };
        Insert: {
          agent_id: string;
          section: "leads" | "solicitudes" | "chats" | "agendamientos" | "acuerdos";
          seen_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["panel_section_views"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "panel_section_views_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_availability: {
        Row: {
          id: string;
          agent_id: string;
          day_of_week: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
          start_time: string;
          end_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          day_of_week: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["agent_availability"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "agent_availability_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      agendamientos: {
        Row: {
          id: string;
          agent_id: string;
          property_id: string;
          chat_conversation_id: string | null;
          lead_id: string | null;
          client_name: string;
          client_phone: string;
          day_of_week: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
          start_time: string;
          end_time: string;
          status: "pending" | "confirmed" | "cancelled" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          property_id: string;
          chat_conversation_id?: string | null;
          lead_id?: string | null;
          client_name: string;
          client_phone: string;
          day_of_week: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
          start_time: string;
          end_time: string;
          status?: "pending" | "confirmed" | "cancelled" | "completed";
        };
        Update: Partial<Database["public"]["Tables"]["agendamientos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "agendamientos_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agendamientos_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agendamientos_chat_conversation_id_fkey";
            columns: ["chat_conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agendamientos_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      short_links: {
        Row: {
          id: string;
          code: string;
          property_id: string;
          user_id: string;
          ref: string;
          click_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          property_id: string;
          user_id: string;
          ref: string;
          click_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["short_links"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "short_links_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "short_links_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_agent_active: {
        Args: { check_agent_id: string };
        Returns: boolean;
      };
      next_shop_process_id: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
