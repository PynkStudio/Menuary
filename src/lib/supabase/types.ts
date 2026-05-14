export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      admin_users: {
        Row: {
          auth_user_id: string | null;
          created_at: string;
          email: string;
          id: string;
          role: Database["public"]["Enums"]["admin_role"];
          tenant_id: string | null;
        };
        Insert: {
          auth_user_id?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          role?: Database["public"]["Enums"]["admin_role"];
          tenant_id?: string | null;
        };
        Update: {
          auth_user_id?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          role?: Database["public"]["Enums"]["admin_role"];
          tenant_id?: string | null;
        };
        Relationships: [];
      };
      extra_list_items: {
        Row: { code: string; id: string; list_id: string; name: string; position: number; price: number };
        Insert: { code: string; id?: string; list_id: string; name: string; position?: number; price?: number };
        Update: { code?: string; id?: string; list_id?: string; name?: string; position?: number; price?: number };
        Relationships: [];
      };
      extra_lists: {
        Row: { code: string; created_at: string; id: string; name: string; tenant_id: string; updated_at: string };
        Insert: { code: string; created_at?: string; id?: string; name: string; tenant_id: string; updated_at?: string };
        Update: { code?: string; created_at?: string; id?: string; name?: string; tenant_id?: string; updated_at?: string };
        Relationships: [];
      };
      gallery_images: {
        Row: { alt: string | null; created_at: string; id: string; position: number; tenant_id: string; url: string };
        Insert: { alt?: string | null; created_at?: string; id?: string; position?: number; tenant_id: string; url: string };
        Update: { alt?: string | null; created_at?: string; id?: string; position?: number; tenant_id?: string; url?: string };
        Relationships: [];
      };
      marketing_leads: {
        Row: {
          city: string | null;
          created_at: string;
          email: string;
          id: string;
          interest: string;
          message: string | null;
          name: string;
          phone: string | null;
          restaurant_name: string;
          source: string;
          status: string;
        };
        Insert: {
          city?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          interest?: string;
          message?: string | null;
          name: string;
          phone?: string | null;
          restaurant_name: string;
          source?: string;
          status?: string;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          interest?: string;
          message?: string | null;
          name?: string;
          phone?: string | null;
          restaurant_name?: string;
          source?: string;
          status?: string;
        };
        Relationships: [];
      };
      menu_categories: {
        Row: {
          code: string; created_at: string; description: string | null; id: string;
          position: number; subtitle: string | null; tenant_id: string; title: string; updated_at: string;
        };
        Insert: {
          code: string; created_at?: string; description?: string | null; id?: string;
          position?: number; subtitle?: string | null; tenant_id: string; title: string; updated_at?: string;
        };
        Update: {
          code?: string; created_at?: string; description?: string | null; id?: string;
          position?: number; subtitle?: string | null; tenant_id?: string; title?: string; updated_at?: string;
        };
        Relationships: [];
      };
      menu_item_extras: {
        Row: { code: string; id: string; item_id: string; name: string; position: number; price: number };
        Insert: { code: string; id?: string; item_id: string; name: string; position?: number; price?: number };
        Update: { code?: string; id?: string; item_id?: string; name?: string; position?: number; price?: number };
        Relationships: [];
      };
      menu_item_ingredients: {
        Row: { code: string; id: string; item_id: string; name: string; position: number };
        Insert: { code: string; id?: string; item_id: string; name: string; position?: number };
        Update: { code?: string; id?: string; item_id?: string; name?: string; position?: number };
        Relationships: [];
      };
      menu_items: {
        Row: {
          abv: string | null; allergens: string[]; available: boolean; bundle_slots: Json | null;
          category_id: string; code: string; created_at: string; description: string | null;
          extra_list_id: string | null; id: string; image: string | null; name: string;
          piccante_level: number | null; position: number; price: Json;
          price_kind: Database["public"]["Enums"]["price_kind"];
          service_notes: string[]; tags: string[]; tenant_id: string; updated_at: string;
        };
        Insert: {
          abv?: string | null; allergens?: string[]; available?: boolean; bundle_slots?: Json | null;
          category_id: string; code: string; created_at?: string; description?: string | null;
          extra_list_id?: string | null; id?: string; image?: string | null; name: string;
          piccante_level?: number | null; position?: number; price: Json;
          price_kind: Database["public"]["Enums"]["price_kind"];
          service_notes?: string[]; tags?: string[]; tenant_id: string; updated_at?: string;
        };
        Update: {
          abv?: string | null; allergens?: string[]; available?: boolean; bundle_slots?: Json | null;
          category_id?: string; code?: string; created_at?: string; description?: string | null;
          extra_list_id?: string | null; id?: string; image?: string | null; name?: string;
          piccante_level?: number | null; position?: number; price?: Json;
          price_kind?: Database["public"]["Enums"]["price_kind"];
          service_notes?: string[]; tags?: string[]; tenant_id?: string; updated_at?: string;
        };
        Relationships: [];
      };
      order_lines: {
        Row: {
          added_extras: Json; bundle_picks: Json; category_id: string | null; id: string;
          item_id: string; item_uuid: string | null; line_total: number; name: string;
          note: string | null; order_id: string; position: number; qty: number;
          removed_ingredients: Json; unit_price: number; variant_key: string | null; variant_label: string | null;
        };
        Insert: {
          added_extras?: Json; bundle_picks?: Json; category_id?: string | null; id?: string;
          item_id: string; item_uuid?: string | null; line_total: number; name: string;
          note?: string | null; order_id: string; position?: number; qty: number;
          removed_ingredients?: Json; unit_price: number; variant_key?: string | null; variant_label?: string | null;
        };
        Update: {
          added_extras?: Json; bundle_picks?: Json; category_id?: string | null; id?: string;
          item_id?: string; item_uuid?: string | null; line_total?: number; name?: string;
          note?: string | null; order_id?: string; position?: number; qty?: number;
          removed_ingredients?: Json; unit_price?: number; variant_key?: string | null; variant_label?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          code: string; created_at: string; customer_name: string | null;
          diner_client_id: string | null; diner_nickname: string | null; id: string;
          menuary_user_id: string | null;
          notes: string | null; pickup_time: string | null; session_code: string | null;
          session_id: string | null; status: Database["public"]["Enums"]["order_status"];
          table_id: string | null; table_label: string | null; tenant_id: string;
          total: number; type: Database["public"]["Enums"]["order_type"]; updated_at: string;
        };
        Insert: {
          code: string; created_at?: string; customer_name?: string | null;
          diner_client_id?: string | null; diner_nickname?: string | null; id?: string;
          menuary_user_id?: string | null;
          notes?: string | null; pickup_time?: string | null; session_code?: string | null;
          session_id?: string | null; status?: Database["public"]["Enums"]["order_status"];
          table_id?: string | null; table_label?: string | null; tenant_id: string;
          total?: number; type: Database["public"]["Enums"]["order_type"]; updated_at?: string;
        };
        Update: {
          code?: string; created_at?: string; customer_name?: string | null;
          diner_client_id?: string | null; diner_nickname?: string | null; id?: string;
          menuary_user_id?: string | null;
          notes?: string | null; pickup_time?: string | null; session_code?: string | null;
          session_id?: string | null; status?: Database["public"]["Enums"]["order_status"];
          table_id?: string | null; table_label?: string | null; tenant_id?: string;
          total?: number; type?: Database["public"]["Enums"]["order_type"]; updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          author: string; created_at: string; date_label: string | null; id: string;
          is_local_guide: boolean; photos_count: number | null; position: number;
          published: boolean; rating: number; reviews_count: number | null; tenant_id: string; text: string;
        };
        Insert: {
          author: string; created_at?: string; date_label?: string | null; id?: string;
          is_local_guide?: boolean; photos_count?: number | null; position?: number;
          published?: boolean; rating: number; reviews_count?: number | null; tenant_id: string; text: string;
        };
        Update: {
          author?: string; created_at?: string; date_label?: string | null; id?: string;
          is_local_guide?: boolean; photos_count?: number | null; position?: number;
          published?: boolean; rating?: number; reviews_count?: number | null; tenant_id?: string; text?: string;
        };
        Relationships: [];
      };
      session_diners: {
        Row: { client_id: string; joined_at: string; nickname: string; session_id: string };
        Insert: { client_id: string; joined_at?: string; nickname: string; session_id: string };
        Update: { client_id?: string; joined_at?: string; nickname?: string; session_id?: string };
        Relationships: [];
      };
      table_sessions: {
        Row: {
          closed_at: string | null; code: string; declared_covers: number | null; id: string;
          opened_at: string; status: Database["public"]["Enums"]["session_status"];
          table_id: string; tenant_id: string;
        };
        Insert: {
          closed_at?: string | null; code: string; declared_covers?: number | null; id?: string;
          opened_at?: string; status?: Database["public"]["Enums"]["session_status"];
          table_id: string; tenant_id: string;
        };
        Update: {
          closed_at?: string | null; code?: string; declared_covers?: number | null; id?: string;
          opened_at?: string; status?: Database["public"]["Enums"]["session_status"];
          table_id?: string; tenant_id?: string;
        };
        Relationships: [];
      };
      tables: {
        Row: {
          area: string;
          created_at: string;
          id: string;
          label: string;
          seats: number | null;
          tenant_id: string;
        };
        Insert: {
          area?: string;
          created_at?: string;
          id?: string;
          label: string;
          seats?: number | null;
          tenant_id: string;
        };
        Update: {
          area?: string;
          created_at?: string;
          id?: string;
          label?: string;
          seats?: number | null;
          tenant_id?: string;
        };
        Relationships: [];
      };
      channel_webhook_events: {
        Row: {
          channel: string;
          error: string | null;
          id: string;
          payload: Json;
          processed_at: string | null;
          received_at: string;
          tenant_id: string | null;
        };
        Insert: {
          channel: string;
          error?: string | null;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          received_at?: string;
          tenant_id?: string | null;
        };
        Update: {
          channel?: string;
          error?: string | null;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          received_at?: string;
          tenant_id?: string | null;
        };
        Relationships: [];
      };
      customer_events: {
        Row: {
          created_at: string;
          customer_id: string;
          event_kind: string;
          id: string;
          meta: Json;
          ref_id: string | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          event_kind: string;
          id?: string;
          meta?: Json;
          ref_id?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          event_kind?: string;
          id?: string;
          meta?: Json;
          ref_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          birth_date: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          menuary_user_id: string | null;
          phone: string | null;
          tags: string[];
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          birth_date?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          menuary_user_id?: string | null;
          phone?: string | null;
          tags?: string[];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          birth_date?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          menuary_user_id?: string | null;
          phone?: string | null;
          tags?: string[];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      delivery_channels: {
        Row: {
          commission_note: string | null;
          created_at: string;
          id: string;
          name: string;
          orders_today: number;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          commission_note?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          orders_today?: number;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          commission_note?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          orders_today?: number;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      inventory_ingredients: {
        Row: {
          cost_per_unit: number;
          created_at: string;
          id: string;
          linked_item_codes: string[];
          name: string;
          stock_qty: number;
          tenant_id: string;
          threshold_qty: number;
          unit: string;
          updated_at: string;
        };
        Insert: {
          cost_per_unit?: number;
          created_at?: string;
          id?: string;
          linked_item_codes?: string[];
          name: string;
          stock_qty?: number;
          tenant_id: string;
          threshold_qty?: number;
          unit?: string;
          updated_at?: string;
        };
        Update: {
          cost_per_unit?: number;
          created_at?: string;
          id?: string;
          linked_item_codes?: string[];
          name?: string;
          stock_qty?: number;
          tenant_id?: string;
          threshold_qty?: number;
          unit?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          address: string | null;
          created_at: string;
          id: string;
          is_default: boolean;
          name: string;
          slug: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name: string;
          slug: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          slug?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      menu_item_translations: {
        Row: {
          description: string | null;
          id: string;
          locale: string;
          menu_item_id: string;
          name: string;
        };
        Insert: {
          description?: string | null;
          id?: string;
          locale: string;
          menu_item_id: string;
          name: string;
        };
        Update: {
          description?: string | null;
          id?: string;
          locale?: string;
          menu_item_id?: string;
          name?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          tenant_id: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          tenant_id: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          tenant_id?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      reservation_requests: {
        Row: {
          assigned_area: string | null;
          channel: string;
          covers: number;
          created_at: string;
          customer_name: string;
          customer_phone: string;
          id: string;
          location_id: string | null;
          menuary_user_id: string | null;
          notes: string | null;
          reservation_date: string;
          reservation_time: string;
          special_request_tags: string[];
          status: string;
          table_id: string | null;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          assigned_area?: string | null;
          channel?: string;
          covers: number;
          created_at?: string;
          customer_name: string;
          customer_phone: string;
          id?: string;
          location_id?: string | null;
          menuary_user_id?: string | null;
          notes?: string | null;
          reservation_date: string;
          reservation_time: string;
          special_request_tags?: string[];
          status?: string;
          table_id?: string | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          assigned_area?: string | null;
          channel?: string;
          covers?: number;
          created_at?: string;
          customer_name?: string;
          customer_phone?: string;
          id?: string;
          location_id?: string | null;
          menuary_user_id?: string | null;
          notes?: string | null;
          reservation_date?: string;
          reservation_time?: string;
          special_request_tags?: string[];
          status?: string;
          table_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_shifts: {
        Row: {
          created_at: string;
          end_time: string;
          id: string;
          location_id: string | null;
          role_label: string | null;
          shift_date: string;
          staff_auth_user_id: string;
          start_time: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          id?: string;
          location_id?: string | null;
          role_label?: string | null;
          shift_date: string;
          staff_auth_user_id: string;
          start_time: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          id?: string;
          location_id?: string | null;
          role_label?: string | null;
          shift_date?: string;
          staff_auth_user_id?: string;
          start_time?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenant_customer_links: {
        Row: {
          established_at: string;
          first_order_id: string | null;
          id: string;
          source: string;
          tenant_id: string;
          user_id: string;
        };
        Insert: {
          established_at?: string;
          first_order_id?: string | null;
          id?: string;
          source: string;
          tenant_id: string;
          user_id: string;
        };
        Update: {
          established_at?: string;
          first_order_id?: string | null;
          id?: string;
          source?: string;
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      time_off_requests: {
        Row: {
          created_at: string;
          end_date: string;
          id: string;
          notes: string | null;
          requester_auth_user_id: string;
          start_date: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          end_date: string;
          id?: string;
          notes?: string | null;
          requester_auth_user_id: string;
          start_date: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          id?: string;
          notes?: string | null;
          requester_auth_user_id?: string;
          start_date?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          birth_date: string | null;
          diet_notes: string | null;
          is_vegetarian: boolean;
          marketing_opt_in: boolean;
          preferred_language: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          birth_date?: string | null;
          diet_notes?: string | null;
          is_vegetarian?: boolean;
          marketing_opt_in?: boolean;
          preferred_language?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          birth_date?: string | null;
          diet_notes?: string | null;
          is_vegetarian?: boolean;
          marketing_opt_in?: boolean;
          preferred_language?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_tenant_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          payload: Json;
          tenant_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          payload?: Json;
          tenant_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          payload?: Json;
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      tenant_overrides: {
        Row: { enabled: boolean | null; features: Json | null; tenant_id: string; updated_at: string };
        Insert: { enabled?: boolean | null; features?: Json | null; tenant_id: string; updated_at?: string };
        Update: { enabled?: boolean | null; features?: Json | null; tenant_id?: string; updated_at?: string };
        Relationships: [];
      };
      tenants: {
        Row: {
          created_at: string; domains: string[]; enabled: boolean; features: Json; hours: Json;
          id: string; label: string; name: string; preview_slug: string | null;
          site_config: Json; theme: Json; updated_at: string;
        };
        Insert: {
          created_at?: string; domains?: string[]; enabled?: boolean; features?: Json; hours?: Json;
          id: string; label: string; name: string; preview_slug?: string | null;
          site_config?: Json; theme?: Json; updated_at?: string;
        };
        Update: {
          created_at?: string; domains?: string[]; enabled?: boolean; features?: Json; hours?: Json;
          id?: string; label?: string; name?: string; preview_slug?: string | null;
          site_config?: Json; theme?: Json; updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      can_admin_tenant: { Args: { t: string }; Returns: boolean };
      current_user_tenant: { Args: Record<string, never>; Returns: string };
      is_platform_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      admin_role: "platform_admin" | "tenant_admin" | "staff" | "kitchen";
      order_status: "nuovo" | "in_preparazione" | "pronto" | "consegnato" | "annullato";
      order_type: "tavolo" | "asporto";
      price_kind: "single" | "sized" | "persone" | "volume";
      session_status: "aperta" | "chiusa";
    };
    CompositeTypes: Record<string, never>;
  };
};
