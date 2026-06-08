export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          display_name: string | null
          email: string
          enabled: boolean
          first_name: string | null
          id: string
          invited_by: string | null
          last_name: string | null
          permissions: Json
          preferred_language: string
          role: Database["public"]["Enums"]["admin_role"]
          tenant_id: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          enabled?: boolean
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_name?: string | null
          permissions?: Json
          preferred_language?: string
          role?: Database["public"]["Enums"]["admin_role"]
          tenant_id?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          enabled?: boolean
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_name?: string | null
          permissions?: Json
          preferred_language?: string
          role?: Database["public"]["Enums"]["admin_role"]
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          kind: string
          method: string
          note: string | null
          order_id: string | null
          session_id: string
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          method?: string
          note?: string | null
          order_id?: string | null
          session_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          method?: string
          note?: string | null
          order_id?: string | null
          session_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_amount: number | null
          expected_amount: number | null
          id: string
          location_id: string | null
          note: string | null
          opened_at: string
          opened_by: string | null
          opening_amount: number
          status: string
          tenant_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          expected_amount?: number | null
          id?: string
          location_id?: string | null
          note?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_amount?: number
          status?: string
          tenant_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          expected_amount?: number | null
          id?: string
          location_id?: string | null
          note?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_amount?: number
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_payment_requests: {
        Row: {
          amount: number
          channel: string
          created_at: string
          currency: string
          id: string
          message_status: string
          metadata: Json
          order_id: string | null
          payment_url: string | null
          provider: string
          provider_session_id: string | null
          recipient_phone: string
          reservation_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          channel: string
          created_at?: string
          currency?: string
          id?: string
          message_status?: string
          metadata?: Json
          order_id?: string | null
          payment_url?: string | null
          provider?: string
          provider_session_id?: string | null
          recipient_phone: string
          reservation_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          channel?: string
          created_at?: string
          currency?: string
          id?: string
          message_status?: string
          metadata?: Json
          order_id?: string | null
          payment_url?: string | null
          provider?: string
          provider_session_id?: string | null
          recipient_phone?: string
          reservation_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_payment_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_payment_requests_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservation_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channel_payment_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_webhook_events: {
        Row: {
          channel: string
          error: string | null
          id: string
          payload: Json
          processed_at: string | null
          received_at: string
          tenant_id: string | null
        }
        Insert: {
          channel: string
          error?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          received_at?: string
          tenant_id?: string | null
        }
        Update: {
          channel?: string
          error?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          received_at?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_webhook_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      customer_events: {
        Row: {
          created_at: string
          customer_id: string
          event_kind: string
          id: string
          meta: Json
          ref_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          event_kind: string
          id?: string
          meta?: Json
          ref_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          event_kind?: string
          id?: string
          meta?: Json
          ref_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          birth_date: string | null
          created_at: string
          display_name: string | null
          email: string | null
          hubrise_customer_id: string | null
          id: string
          menuary_user_id: string | null
          phone: string | null
          source: string
          tags: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          hubrise_customer_id?: string | null
          id?: string
          menuary_user_id?: string | null
          phone?: string | null
          source?: string
          tags?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          hubrise_customer_id?: string | null
          id?: string
          menuary_user_id?: string | null
          phone?: string | null
          source?: string
          tags?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_channels: {
        Row: {
          commission_note: string | null
          created_at: string
          id: string
          name: string
          orders_today: number
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          commission_note?: string | null
          created_at?: string
          id?: string
          name: string
          orders_today?: number
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          commission_note?: string | null
          created_at?: string
          id?: string
          name?: string
          orders_today?: number
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_channels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_signatures: {
        Row: {
          brand: string
          created_at: string
          email: string
          html: string
          id: string
          name: string
          phone: string
          title: string
          updated_at: string
          user_id: string
          website: string
        }
        Insert: {
          brand: string
          created_at?: string
          email?: string
          html?: string
          id?: string
          name?: string
          phone?: string
          title?: string
          updated_at?: string
          user_id: string
          website?: string
        }
        Update: {
          brand?: string
          created_at?: string
          email?: string
          html?: string
          id?: string
          name?: string
          phone?: string
          title?: string
          updated_at?: string
          user_id?: string
          website?: string
        }
        Relationships: []
      }
      email_tracking_events: {
        Row: {
          brand: string | null
          created_at: string
          event_type: string
          from_address: string | null
          id: string
          metadata: Json
          resend_email_id: string
          subject: string | null
          to_address: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          event_type: string
          from_address?: string | null
          id?: string
          metadata?: Json
          resend_email_id: string
          subject?: string | null
          to_address?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          event_type?: string
          from_address?: string | null
          id?: string
          metadata?: Json
          resend_email_id?: string
          subject?: string | null
          to_address?: string | null
        }
        Relationships: []
      }
      employee: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          enabled: boolean
          first_name: string | null
          id: string
          invited_by: string | null
          last_name: string | null
          permissions: Json
          preferred_language: string
          role: Database["public"]["Enums"]["employee_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          enabled?: boolean
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_name?: string | null
          permissions?: Json
          preferred_language?: string
          role?: Database["public"]["Enums"]["employee_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          enabled?: boolean
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_name?: string | null
          permissions?: Json
          preferred_language?: string
          role?: Database["public"]["Enums"]["employee_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      extra_list_items: {
        Row: {
          code: string
          id: string
          list_id: string
          name: string
          position: number
          price: number
        }
        Insert: {
          code: string
          id?: string
          list_id: string
          name: string
          position?: number
          price?: number
        }
        Update: {
          code?: string
          id?: string
          list_id?: string
          name?: string
          position?: number
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "extra_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "extra_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_lists: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_lists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          location_id: string | null
          position: number
          tenant_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          position?: number
          tenant_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          position?: number
          tenant_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_images_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      google_sync_log: {
        Row: {
          error_message: string | null
          id: string
          rating: number | null
          rating_count: number | null
          reviews_fetched: number | null
          status: string
          synced_at: string
          tenant_id: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          rating?: number | null
          rating_count?: number | null
          reviews_fetched?: number | null
          status?: string
          synced_at?: string
          tenant_id: string
        }
        Update: {
          error_message?: string | null
          id?: string
          rating?: number | null
          rating_count?: number | null
          reviews_fetched?: number | null
          status?: string
          synced_at?: string
          tenant_id?: string
        }
        Relationships: []
      }
      hubrise_inbound_log: {
        Row: {
          event: string | null
          hubrise_location_id: string | null
          id: string
          payload: Json | null
          reason: string | null
          received_at: string
          resolved: boolean
          resolved_at: string | null
          resource_id: string | null
          signature: string | null
          status: string
        }
        Insert: {
          event?: string | null
          hubrise_location_id?: string | null
          id?: string
          payload?: Json | null
          reason?: string | null
          received_at?: string
          resolved?: boolean
          resolved_at?: string | null
          resource_id?: string | null
          signature?: string | null
          status: string
        }
        Update: {
          event?: string | null
          hubrise_location_id?: string | null
          id?: string
          payload?: Json | null
          reason?: string | null
          received_at?: string
          resolved?: boolean
          resolved_at?: string | null
          resource_id?: string | null
          signature?: string | null
          status?: string
        }
        Relationships: []
      }
      hubrise_links: {
        Row: {
          catalog_id: string | null
          created_at: string
          customer_list_id: string | null
          hubrise_account_id: string | null
          hubrise_location_id: string
          id: string
          last_menu_push_at: string | null
          last_menu_push_hash: string | null
          location_id: string | null
          location_name: string | null
          location_token: string
          menu_push_enabled: boolean
          orders_inbound_enabled: boolean
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          catalog_id?: string | null
          created_at?: string
          customer_list_id?: string | null
          hubrise_account_id?: string | null
          hubrise_location_id: string
          id?: string
          last_menu_push_at?: string | null
          last_menu_push_hash?: string | null
          location_id?: string | null
          location_name?: string | null
          location_token: string
          menu_push_enabled?: boolean
          orders_inbound_enabled?: boolean
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          catalog_id?: string | null
          created_at?: string
          customer_list_id?: string | null
          hubrise_account_id?: string | null
          hubrise_location_id?: string
          id?: string
          last_menu_push_at?: string | null
          last_menu_push_hash?: string | null
          location_id?: string | null
          location_name?: string | null
          location_token?: string
          menu_push_enabled?: boolean
          orders_inbound_enabled?: boolean
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hubrise_links_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hubrise_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hubrise_menu_sync_log: {
        Row: {
          completed_at: string | null
          error: string | null
          id: string
          link_id: string
          payload_hash: string | null
          started_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          error?: string | null
          id?: string
          link_id: string
          payload_hash?: string | null
          started_at?: string
          status: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          error?: string | null
          id?: string
          link_id?: string
          payload_hash?: string | null
          started_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hubrise_menu_sync_log_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "hubrise_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hubrise_menu_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_emails: {
        Row: {
          archived: boolean
          assigned_to_user_id: string | null
          attachments: Json
          brand: string
          created_at: string
          from_address: string
          from_name: string | null
          headers: Json
          html_body: string | null
          id: string
          lead_id: string | null
          message_id: string | null
          read: boolean
          starred: boolean
          subject: string
          tenant_id: string | null
          text_body: string | null
          to_addresses: string[]
        }
        Insert: {
          archived?: boolean
          assigned_to_user_id?: string | null
          attachments?: Json
          brand: string
          created_at?: string
          from_address: string
          from_name?: string | null
          headers?: Json
          html_body?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          read?: boolean
          starred?: boolean
          subject?: string
          tenant_id?: string | null
          text_body?: string | null
          to_addresses: string[]
        }
        Update: {
          archived?: boolean
          assigned_to_user_id?: string | null
          attachments?: Json
          brand?: string
          created_at?: string
          from_address?: string
          from_name?: string | null
          headers?: Json
          html_body?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          read?: boolean
          starred?: boolean
          subject?: string
          tenant_id?: string | null
          text_body?: string | null
          to_addresses?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "inbound_emails_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "siteadmin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_emails_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_ingredients: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          linked_item_codes: string[]
          name: string
          stock_qty: number
          tenant_id: string
          threshold_qty: number
          unit: string
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          linked_item_codes?: string[]
          name: string
          stock_qty?: number
          tenant_id: string
          threshold_qty?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          linked_item_codes?: string[]
          name?: string
          stock_qty?: number
          tenant_id?: string
          threshold_qty?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_ingredients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      kiosk_devices: {
        Row: {
          config: Json
          created_at: string
          device_token: string | null
          enabled: boolean
          id: string
          last_seen_at: string | null
          location_id: string | null
          name: string
          paired_at: string | null
          pairing_code: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          device_token?: string | null
          enabled?: boolean
          id?: string
          last_seen_at?: string | null
          location_id?: string | null
          name: string
          paired_at?: string | null
          pairing_code: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          device_token?: string | null
          enabled?: boolean
          id?: string
          last_seen_at?: string | null
          location_id?: string | null
          name?: string
          paired_at?: string | null
          pairing_code?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kiosk_devices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kiosk_devices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          hours: Json
          id: string
          is_default: boolean
          name: string
          phone: string | null
          routing_mode: string
          slug: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          hours?: Json
          id?: string
          is_default?: boolean
          name: string
          phone?: string | null
          routing_mode?: string
          slug: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          hours?: Json
          id?: string
          is_default?: boolean
          name?: string
          phone?: string | null
          routing_mode?: string
          slug?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_leads: {
        Row: {
          city: string | null
          created_at: string
          email: string
          id: string
          interest: string
          message: string | null
          name: string
          phone: string | null
          restaurant_name: string
          source: string
          status: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          id?: string
          interest?: string
          message?: string | null
          name: string
          phone?: string | null
          restaurant_name: string
          source?: string
          status?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          interest?: string
          message?: string | null
          name?: string
          phone?: string | null
          restaurant_name?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          availability: Json | null
          code: string
          created_at: string
          description: string | null
          id: string
          location_id: string | null
          position: number
          subtitle: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          availability?: Json | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          location_id?: string | null
          position?: number
          subtitle?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          availability?: Json | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          location_id?: string | null
          position?: number
          subtitle?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_extras: {
        Row: {
          code: string
          id: string
          item_id: string
          name: string
          position: number
          price: number
        }
        Insert: {
          code: string
          id?: string
          item_id: string
          name: string
          position?: number
          price?: number
        }
        Update: {
          code?: string
          id?: string
          item_id?: string
          name?: string
          position?: number
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_extras_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_ingredients: {
        Row: {
          code: string
          id: string
          item_id: string
          name: string
          position: number
        }
        Insert: {
          code: string
          id?: string
          item_id: string
          name: string
          position?: number
        }
        Update: {
          code?: string
          id?: string
          item_id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_ingredients_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_translations: {
        Row: {
          description: string | null
          id: string
          locale: string
          menu_item_id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          locale: string
          menu_item_id: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          locale?: string
          menu_item_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_translations_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          abv: string | null
          allergens: string[]
          available: boolean
          bookable: boolean
          bundle_slots: Json | null
          category_id: string
          code: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          extra_list_id: string | null
          id: string
          image: string | null
          location_id: string | null
          name: string
          piccante_level: number | null
          position: number
          price: Json
          price_kind: Database["public"]["Enums"]["price_kind"]
          service_notes: string[]
          tag_meta: Json
          tags: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          abv?: string | null
          allergens?: string[]
          available?: boolean
          bookable?: boolean
          bundle_slots?: Json | null
          category_id: string
          code: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          extra_list_id?: string | null
          id?: string
          image?: string | null
          location_id?: string | null
          name: string
          piccante_level?: number | null
          position?: number
          price: Json
          price_kind: Database["public"]["Enums"]["price_kind"]
          service_notes?: string[]
          tag_meta?: Json
          tags?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          abv?: string | null
          allergens?: string[]
          available?: boolean
          bookable?: boolean
          bundle_slots?: Json | null
          category_id?: string
          code?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          extra_list_id?: string | null
          id?: string
          image?: string | null
          location_id?: string | null
          name?: string
          piccante_level?: number | null
          position?: number
          price?: Json
          price_kind?: Database["public"]["Enums"]["price_kind"]
          service_notes?: string[]
          tag_meta?: Json
          tags?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_extra_list_id_fkey"
            columns: ["extra_list_id"]
            isOneToOne: false
            referencedRelation: "extra_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_list_items: {
        Row: {
          item_id: string
          list_id: string
          position: number
        }
        Insert: {
          item_id: string
          list_id: string
          position?: number
        }
        Update: {
          item_id?: string
          list_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_list_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "menu_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_lists: {
        Row: {
          code: string
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          name: string
          position: number
          tenant_id: string
          updated_at: string
          visibility: Json
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name: string
          position?: number
          tenant_id: string
          updated_at?: string
          visibility?: Json
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          name?: string
          position?: number
          tenant_id?: string
          updated_at?: string
          visibility?: Json
        }
        Relationships: [
          {
            foreignKeyName: "menu_lists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_lines: {
        Row: {
          added_extras: Json
          bundle_picks: Json
          category_id: string | null
          id: string
          item_id: string
          item_uuid: string | null
          line_total: number
          name: string
          note: string | null
          order_id: string
          position: number
          qty: number
          removed_ingredients: Json
          unit_price: number
          variant_key: string | null
          variant_label: string | null
        }
        Insert: {
          added_extras?: Json
          bundle_picks?: Json
          category_id?: string | null
          id?: string
          item_id: string
          item_uuid?: string | null
          line_total: number
          name: string
          note?: string | null
          order_id: string
          position?: number
          qty: number
          removed_ingredients?: Json
          unit_price: number
          variant_key?: string | null
          variant_label?: string | null
        }
        Update: {
          added_extras?: Json
          bundle_picks?: Json
          category_id?: string | null
          id?: string
          item_id?: string
          item_uuid?: string | null
          line_total?: number
          name?: string
          note?: string | null
          order_id?: string
          position?: number
          qty?: number
          removed_ingredients?: Json
          unit_price?: number
          variant_key?: string | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_item_uuid_fkey"
            columns: ["item_uuid"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          auto_accepted: boolean
          code: string
          confirmation_expires_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_doorbell: string | null
          delivery_floor: string | null
          delivery_notes: string | null
          desired_time: string | null
          dine_option: string | null
          diner_client_id: string | null
          diner_nickname: string | null
          external_order_id: string | null
          external_payload: Json | null
          external_platform: string | null
          fulfillment_type: string
          id: string
          location_id: string | null
          menuary_user_id: string | null
          notes: string | null
          payment_link_url: string | null
          payment_status: string
          public_token: string
          pickup_time: string | null
          session_code: string | null
          session_id: string | null
          source: string
          status: Database["public"]["Enums"]["order_status"]
          table_id: string | null
          table_label: string | null
          tenant_id: string
          total: number
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
        }
        Insert: {
          auto_accepted?: boolean
          code: string
          confirmation_expires_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_doorbell?: string | null
          delivery_floor?: string | null
          delivery_notes?: string | null
          desired_time?: string | null
          dine_option?: string | null
          diner_client_id?: string | null
          diner_nickname?: string | null
          external_order_id?: string | null
          external_payload?: Json | null
          external_platform?: string | null
          fulfillment_type?: string
          id?: string
          location_id?: string | null
          menuary_user_id?: string | null
          notes?: string | null
          payment_link_url?: string | null
          payment_status?: string
          public_token?: string
          pickup_time?: string | null
          session_code?: string | null
          session_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
          table_label?: string | null
          tenant_id: string
          total?: number
          type: Database["public"]["Enums"]["order_type"]
          updated_at?: string
        }
        Update: {
          auto_accepted?: boolean
          code?: string
          confirmation_expires_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_doorbell?: string | null
          delivery_floor?: string | null
          delivery_notes?: string | null
          desired_time?: string | null
          dine_option?: string | null
          diner_client_id?: string | null
          diner_nickname?: string | null
          external_order_id?: string | null
          external_payload?: Json | null
          external_platform?: string | null
          fulfillment_type?: string
          id?: string
          location_id?: string | null
          menuary_user_id?: string | null
          notes?: string | null
          payment_link_url?: string | null
          payment_status?: string
          public_token?: string
          pickup_time?: string | null
          session_code?: string | null
          session_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
          table_label?: string | null
          tenant_id?: string
          total?: number
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_text_messages: {
        Row: {
          attempts: Json
          body: string
          channel: string
          channel_payment_request_id: string | null
          created_at: string
          fallback_channel: string | null
          id: string
          kind: string
          last_error: string | null
          metadata: Json
          order_id: string | null
          recipient_phone: string
          scheduled_at: string
          sent_at: string | null
          source: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attempts?: Json
          body: string
          channel: string
          channel_payment_request_id?: string | null
          created_at?: string
          fallback_channel?: string | null
          id?: string
          kind: string
          last_error?: string | null
          metadata?: Json
          order_id?: string | null
          recipient_phone: string
          scheduled_at?: string
          sent_at?: string | null
          source?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attempts?: Json
          body?: string
          channel?: string
          channel_payment_request_id?: string | null
          created_at?: string
          fallback_channel?: string | null
          id?: string
          kind?: string
          last_error?: string | null
          metadata?: Json
          order_id?: string | null
          recipient_phone?: string
          scheduled_at?: string
          sent_at?: string | null
          source?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_text_messages_channel_payment_request_id_fkey"
            columns: ["channel_payment_request_id"]
            isOneToOne: false
            referencedRelation: "channel_payment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_text_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_text_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_commissions: {
        Row: {
          billing_cycle: string
          closed_at: string
          commission_amount: number | null
          commission_kind: string
          commission_rate: number
          created_at: string
          first_payment_amount: number
          id: string
          lead_id: string
          paid_at: string | null
          payment_id: string | null
          recurring_amount: number
          seller_name: string
          seller_role: string
          seller_user_id: string | null
          setup_amount: number
          status: string
          subscription_id: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle: string
          closed_at?: string
          commission_amount?: number | null
          commission_kind?: string
          commission_rate?: number
          created_at?: string
          first_payment_amount?: number
          id?: string
          lead_id: string
          paid_at?: string | null
          payment_id?: string | null
          recurring_amount?: number
          seller_name: string
          seller_role?: string
          seller_user_id?: string | null
          setup_amount?: number
          status?: string
          subscription_id: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          closed_at?: string
          commission_amount?: number | null
          commission_kind?: string
          commission_rate?: number
          created_at?: string
          first_payment_amount?: number
          id?: string
          lead_id?: string
          paid_at?: string | null
          payment_id?: string | null
          recurring_amount?: number
          seller_name?: string
          seller_role?: string
          seller_user_id?: string | null
          setup_amount?: number
          status?: string
          subscription_id?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_commissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "platform_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "platform_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_lead_locations: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          id: string
          is_primary: boolean
          lead_id: string
          name: string
          postal_code: string | null
          province: string | null
          street: string | null
          street_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          lead_id: string
          name?: string
          postal_code?: string | null
          province?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          lead_id?: string
          name?: string
          postal_code?: string | null
          province?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_lead_locations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_leads: {
        Row: {
          address: string | null
          billing_address: string | null
          billing_cf: string | null
          billing_city: string | null
          billing_name: string | null
          billing_pec: string | null
          billing_postal_code: string | null
          billing_province: string | null
          billing_sdi: string | null
          billing_vat: string | null
          business_name: string
          business_slug: string | null
          business_type: string | null
          business_vertical: string
          city: string | null
          contact_email: string | null
          contact_first_name: string | null
          contact_last_name: string | null
          contact_name: string | null
          contact_phone: string | null
          converted_at: string | null
          country: string
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          demo_pr_url: string | null
          demo_url: string | null
          has_google_maps: boolean | null
          has_website: boolean | null
          id: string
          maps_ownership_claimed: boolean | null
          maps_profile_complete: boolean | null
          matching_score: number | null
          notes: string | null
          official_domain: string | null
          official_domain_active: boolean
          postal_code: string | null
          priority_score: number | null
          province: string | null
          sales_owner_id: string | null
          sales_owner_name: string | null
          source: string | null
          stage: string
          status: string
          temperature: string
          tenant_id: string | null
          updated_at: string
          website_score_beauty: number | null
          website_score_clarity: number | null
          website_score_functionality: number | null
          website_score_updated: number | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          billing_address?: string | null
          billing_cf?: string | null
          billing_city?: string | null
          billing_name?: string | null
          billing_pec?: string | null
          billing_postal_code?: string | null
          billing_province?: string | null
          billing_sdi?: string | null
          billing_vat?: string | null
          business_name: string
          business_slug?: string | null
          business_type?: string | null
          business_vertical?: string
          city?: string | null
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_at?: string | null
          country?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          demo_pr_url?: string | null
          demo_url?: string | null
          has_google_maps?: boolean | null
          has_website?: boolean | null
          id?: string
          maps_ownership_claimed?: boolean | null
          maps_profile_complete?: boolean | null
          matching_score?: number | null
          notes?: string | null
          official_domain?: string | null
          official_domain_active?: boolean
          postal_code?: string | null
          priority_score?: number | null
          province?: string | null
          sales_owner_id?: string | null
          sales_owner_name?: string | null
          source?: string | null
          stage?: string
          status?: string
          temperature?: string
          tenant_id?: string | null
          updated_at?: string
          website_score_beauty?: number | null
          website_score_clarity?: number | null
          website_score_functionality?: number | null
          website_score_updated?: number | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          billing_address?: string | null
          billing_cf?: string | null
          billing_city?: string | null
          billing_name?: string | null
          billing_pec?: string | null
          billing_postal_code?: string | null
          billing_province?: string | null
          billing_sdi?: string | null
          billing_vat?: string | null
          business_name?: string
          business_slug?: string | null
          business_type?: string | null
          business_vertical?: string
          city?: string | null
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_at?: string | null
          country?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          demo_pr_url?: string | null
          demo_url?: string | null
          has_google_maps?: boolean | null
          has_website?: boolean | null
          id?: string
          maps_ownership_claimed?: boolean | null
          maps_profile_complete?: boolean | null
          matching_score?: number | null
          notes?: string | null
          official_domain?: string | null
          official_domain_active?: boolean
          postal_code?: string | null
          priority_score?: number | null
          province?: string | null
          sales_owner_id?: string | null
          sales_owner_name?: string | null
          source?: string | null
          stage?: string
          status?: string
          temperature?: string
          tenant_id?: string | null
          updated_at?: string
          website_score_beauty?: number | null
          website_score_clarity?: number | null
          website_score_functionality?: number | null
          website_score_updated?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_package_market_prices: {
        Row: {
          country_code: string
          created_at: string
          currency: string
          id: string
          package_id: string | null
          package_slug: string
          price_monthly: number
          price_monthly_billing: number | null
          setup_from: string | null
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          currency?: string
          id?: string
          package_id?: string | null
          package_slug: string
          price_monthly?: number
          price_monthly_billing?: number | null
          setup_from?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          currency?: string
          id?: string
          package_id?: string | null
          package_slug?: string
          price_monthly?: number
          price_monthly_billing?: number | null
          setup_from?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_package_market_prices_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "platform_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_packages: {
        Row: {
          adapted_name: string | null
          created_at: string
          cta_label: string | null
          currency: string
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          marketing_description: string | null
          marketing_items: string[]
          marketing_name: string | null
          min_package_slug: string | null
          modules: string[]
          name: string
          package_kind: string
          price_monthly: number
          price_monthly_billing: number | null
          price_yearly: number | null
          settings: Json
          setup_from: string | null
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
          vertical: string
        }
        Insert: {
          adapted_name?: string | null
          created_at?: string
          cta_label?: string | null
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          marketing_description?: string | null
          marketing_items?: string[]
          marketing_name?: string | null
          min_package_slug?: string | null
          modules?: string[]
          name: string
          package_kind?: string
          price_monthly?: number
          price_monthly_billing?: number | null
          price_yearly?: number | null
          settings?: Json
          setup_from?: string | null
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          vertical?: string
        }
        Update: {
          adapted_name?: string | null
          created_at?: string
          cta_label?: string | null
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          marketing_description?: string | null
          marketing_items?: string[]
          marketing_name?: string | null
          min_package_slug?: string | null
          modules?: string[]
          name?: string
          package_kind?: string
          price_monthly?: number
          price_monthly_billing?: number | null
          price_yearly?: number | null
          settings?: Json
          setup_from?: string | null
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
          vertical?: string
        }
        Relationships: []
      }
      platform_payments: {
        Row: {
          amount: number
          billing_payload: Json | null
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_number: string | null
          lead_id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          status: string
          stripe_payment_link: string | null
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          billing_payload?: Json | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          lead_id: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          stripe_payment_link?: string | null
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_payload?: Json | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          lead_id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          stripe_payment_link?: string | null
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_payments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "platform_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_subscription_locations: {
        Row: {
          created_at: string
          id: string
          lead_location_id: string
          modules_override: string[] | null
          package_id: string
          price_factor: number
          subscription_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_location_id: string
          modules_override?: string[] | null
          package_id: string
          price_factor?: number
          subscription_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_location_id?: string
          modules_override?: string[] | null
          package_id?: string
          price_factor?: number
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_subscription_locations_lead_location_id_fkey"
            columns: ["lead_location_id"]
            isOneToOne: false
            referencedRelation: "platform_lead_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_subscription_locations_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "platform_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_subscription_locations_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "platform_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_subscriptions: {
        Row: {
          billing_cycle: string
          cancelled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          first_payment_amount: number | null
          id: string
          lead_id: string
          next_renewal_at: string | null
          notes: string | null
          package_id: string
          price_override: number | null
          setup_amount: number
          started_at: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          first_payment_amount?: number | null
          id?: string
          lead_id: string
          next_renewal_at?: string | null
          notes?: string | null
          package_id: string
          price_override?: number | null
          setup_amount?: number
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          first_payment_amount?: number | null
          id?: string
          lead_id?: string
          next_renewal_at?: string | null
          notes?: string | null
          package_id?: string
          price_override?: number | null
          setup_amount?: number
          started_at?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_subscriptions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "platform_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          tenant_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          tenant_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_requests: {
        Row: {
          assigned_area: string | null
          channel: string
          covers: number
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          duration_minutes: number | null
          id: string
          location_id: string | null
          menuary_user_id: string | null
          notes: string | null
          reservation_date: string
          reservation_time: string
          service_id: string | null
          special_request_tags: string[]
          status: string
          table_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_area?: string | null
          channel?: string
          covers: number
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          duration_minutes?: number | null
          id?: string
          location_id?: string | null
          menuary_user_id?: string | null
          notes?: string | null
          reservation_date: string
          reservation_time: string
          service_id?: string | null
          special_request_tags?: string[]
          status?: string
          table_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_area?: string | null
          channel?: string
          covers?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          duration_minutes?: number | null
          id?: string
          location_id?: string | null
          menuary_user_id?: string | null
          notes?: string | null
          reservation_date?: string
          reservation_time?: string
          service_id?: string | null
          special_request_tags?: string[]
          status?: string
          table_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author: string
          created_at: string
          date_label: string | null
          google_review_id: string | null
          id: string
          is_local_guide: boolean
          language_code: string | null
          location_id: string | null
          original_language_code: string | null
          photos_count: number | null
          position: number
          published: boolean
          rating: number
          replied_at: string | null
          reply_comment: string | null
          reviews_count: number | null
          source: string
          tenant_id: string
          text: string
          translated: boolean | null
        }
        Insert: {
          author: string
          created_at?: string
          date_label?: string | null
          google_review_id?: string | null
          id?: string
          is_local_guide?: boolean
          language_code?: string | null
          location_id?: string | null
          original_language_code?: string | null
          photos_count?: number | null
          position?: number
          published?: boolean
          rating: number
          replied_at?: string | null
          reply_comment?: string | null
          reviews_count?: number | null
          source?: string
          tenant_id: string
          text: string
          translated?: boolean | null
        }
        Update: {
          author?: string
          created_at?: string
          date_label?: string | null
          google_review_id?: string | null
          id?: string
          is_local_guide?: boolean
          language_code?: string | null
          location_id?: string | null
          original_language_code?: string | null
          photos_count?: number | null
          position?: number
          published?: boolean
          rating?: number
          replied_at?: string | null
          reply_comment?: string | null
          reviews_count?: number | null
          source?: string
          tenant_id?: string
          text?: string
          translated?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_emails: {
        Row: {
          brand: string
          created_at: string
          from_address: string
          from_name: string | null
          html_body: string | null
          id: string
          lead_id: string | null
          resend_message_id: string | null
          sent_by_name: string | null
          sent_by_user_id: string | null
          status: string
          subject: string
          tenant_id: string | null
          to_addresses: string[]
        }
        Insert: {
          brand: string
          created_at?: string
          from_address: string
          from_name?: string | null
          html_body?: string | null
          id?: string
          lead_id?: string | null
          resend_message_id?: string | null
          sent_by_name?: string | null
          sent_by_user_id?: string | null
          status?: string
          subject?: string
          tenant_id?: string | null
          to_addresses: string[]
        }
        Update: {
          brand?: string
          created_at?: string
          from_address?: string
          from_name?: string | null
          html_body?: string | null
          id?: string
          lead_id?: string | null
          resend_message_id?: string | null
          sent_by_name?: string | null
          sent_by_user_id?: string | null
          status?: string
          subject?: string
          tenant_id?: string | null
          to_addresses?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "sent_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_emails_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      session_diners: {
        Row: {
          client_id: string
          joined_at: string
          nickname: string
          session_id: string
        }
        Insert: {
          client_id: string
          joined_at?: string
          nickname: string
          session_id: string
        }
        Update: {
          client_id?: string
          joined_at?: string
          nickname?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_diners_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          end_at: string
          id: string
          location_id: string | null
          note: string | null
          role: string | null
          start_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          end_at: string
          id?: string
          location_id?: string | null
          note?: string | null
          role?: string | null
          start_at: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          end_at?: string
          id?: string
          location_id?: string | null
          note?: string | null
          role?: string | null
          start_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      siteadmin: {
        Row: {
          commission_rate: number
          created_at: string
          display_name: string | null
          email: string
          enabled: boolean
          first_name: string | null
          id: string
          invited_by: string | null
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["siteadmin_role"]
          user_id: string
          work_hours: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          display_name?: string | null
          email: string
          enabled?: boolean
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["siteadmin_role"]
          user_id: string
          work_hours?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string
          display_name?: string | null
          email?: string
          enabled?: boolean
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["siteadmin_role"]
          user_id?: string
          work_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "siteadmin_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      siteadmin_email_aliases: {
        Row: {
          alias: string
          alias_type: string
          created_at: string
          id: string
          siteadmin_id: string
        }
        Insert: {
          alias: string
          alias_type: string
          created_at?: string
          id?: string
          siteadmin_id: string
        }
        Update: {
          alias?: string
          alias_type?: string
          created_at?: string
          id?: string
          siteadmin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "siteadmin_email_aliases_siteadmin_id_fkey"
            columns: ["siteadmin_id"]
            isOneToOne: false
            referencedRelation: "siteadmin"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_locations: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          location_id: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          location_id: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_locations_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_shifts: {
        Row: {
          created_at: string
          end_time: string
          id: string
          location_id: string | null
          role_label: string | null
          shift_date: string
          staff_auth_user_id: string | null
          start_time: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          location_id?: string | null
          role_label?: string | null
          shift_date: string
          staff_auth_user_id?: string | null
          start_time: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          location_id?: string | null
          role_label?: string | null
          shift_date?: string
          staff_auth_user_id?: string | null
          start_time?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_shifts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          body: string
          channel: string
          created_at: string
          direction: string
          from_address: string | null
          html_body: string | null
          id: string
          metadata: Json
          provider_message_id: string | null
          sent_by_siteadmin_id: string | null
          ticket_id: string
          to_addresses: string[]
        }
        Insert: {
          body?: string
          channel?: string
          created_at?: string
          direction: string
          from_address?: string | null
          html_body?: string | null
          id?: string
          metadata?: Json
          provider_message_id?: string | null
          sent_by_siteadmin_id?: string | null
          ticket_id: string
          to_addresses?: string[]
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          direction?: string
          from_address?: string | null
          html_body?: string | null
          id?: string
          metadata?: Json
          provider_message_id?: string | null
          sent_by_siteadmin_id?: string | null
          ticket_id?: string
          to_addresses?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_sent_by_siteadmin_id_fkey"
            columns: ["sent_by_siteadmin_id"]
            isOneToOne: false
            referencedRelation: "siteadmin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to_siteadmin_id: string | null
          body: string
          created_at: string
          id: string
          last_response_at: string | null
          metadata: Json
          priority: string
          requester_email: string | null
          requester_name: string | null
          requester_phone_e164: string | null
          resolved_at: string | null
          source: string
          status: string
          subject: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_to_siteadmin_id?: string | null
          body?: string
          created_at?: string
          id?: string
          last_response_at?: string | null
          metadata?: Json
          priority?: string
          requester_email?: string | null
          requester_name?: string | null
          requester_phone_e164?: string | null
          resolved_at?: string | null
          source?: string
          status?: string
          subject?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to_siteadmin_id?: string | null
          body?: string
          created_at?: string
          id?: string
          last_response_at?: string | null
          metadata?: Json
          priority?: string
          requester_email?: string | null
          requester_name?: string | null
          requester_phone_e164?: string | null
          resolved_at?: string | null
          source?: string
          status?: string
          subject?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_siteadmin_id_fkey"
            columns: ["assigned_to_siteadmin_id"]
            isOneToOne: false
            referencedRelation: "siteadmin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      table_sessions: {
        Row: {
          closed_at: string | null
          code: string
          declared_covers: number | null
          id: string
          opened_at: string
          status: Database["public"]["Enums"]["session_status"]
          table_id: string
          tenant_id: string
        }
        Insert: {
          closed_at?: string | null
          code: string
          declared_covers?: number | null
          id?: string
          opened_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          table_id: string
          tenant_id: string
        }
        Update: {
          closed_at?: string | null
          code?: string
          declared_covers?: number | null
          id?: string
          opened_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          table_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          area: string
          created_at: string
          id: string
          label: string
          location_id: string | null
          seats: number | null
          tenant_id: string
        }
        Insert: {
          area?: string
          created_at?: string
          id?: string
          label: string
          location_id?: string | null
          seats?: number | null
          tenant_id: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          label?: string
          location_id?: string | null
          seats?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_ai_phone_settings: {
        Row: {
          after_hours_mode: string
          confirm_before_write: boolean
          created_at: string
          enabled: boolean
          greeting_message: string | null
          handoff_phone: string | null
          human_transfer_enabled: boolean
          include_special_hours: boolean
          language: string
          menu_sync_enabled: boolean
          order_controls: Json
          payment_controls: Json
          phone_number: string | null
          quick_settings: Json
          reservation_controls: Json
          retell_agent_id: string | null
          retell_phone_number_id: string | null
          system_prompt: string | null
          tenant_id: string
          updated_at: string
          voice_label: string | null
        }
        Insert: {
          after_hours_mode?: string
          confirm_before_write?: boolean
          created_at?: string
          enabled?: boolean
          greeting_message?: string | null
          handoff_phone?: string | null
          human_transfer_enabled?: boolean
          include_special_hours?: boolean
          language?: string
          menu_sync_enabled?: boolean
          order_controls?: Json
          payment_controls?: Json
          phone_number?: string | null
          quick_settings?: Json
          reservation_controls?: Json
          retell_agent_id?: string | null
          retell_phone_number_id?: string | null
          system_prompt?: string | null
          tenant_id: string
          updated_at?: string
          voice_label?: string | null
        }
        Update: {
          after_hours_mode?: string
          confirm_before_write?: boolean
          created_at?: string
          enabled?: boolean
          greeting_message?: string | null
          handoff_phone?: string | null
          human_transfer_enabled?: boolean
          include_special_hours?: boolean
          language?: string
          menu_sync_enabled?: boolean
          order_controls?: Json
          payment_controls?: Json
          phone_number?: string | null
          quick_settings?: Json
          reservation_controls?: Json
          retell_agent_id?: string | null
          retell_phone_number_id?: string | null
          system_prompt?: string | null
          tenant_id?: string
          updated_at?: string
          voice_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_ai_phone_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_ai_voice: {
        Row: {
          audience: string
          do_examples: string
          dont_examples: string
          keywords: string
          tenant_id: string
          tone: string
          updated_at: string
        }
        Insert: {
          audience?: string
          do_examples?: string
          dont_examples?: string
          keywords?: string
          tenant_id: string
          tone?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          do_examples?: string
          dont_examples?: string
          keywords?: string
          tenant_id?: string
          tone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_ai_voice_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_customer_links: {
        Row: {
          established_at: string
          first_order_id: string | null
          id: string
          source: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          established_at?: string
          first_order_id?: string | null
          id?: string
          source: string
          tenant_id: string
          user_id: string
        }
        Update: {
          established_at?: string
          first_order_id?: string | null
          id?: string
          source?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_customer_links_first_order_id_fkey"
            columns: ["first_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_customer_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_customer_service_actions: {
        Row: {
          action_type: string
          applied_at: string | null
          conversation_id: string
          created_at: string
          error: string | null
          id: string
          input_text: string
          parameters: Json
          requested_by_phone_e164: string
          result: Json
          status: string
          tenant_id: string | null
        }
        Insert: {
          action_type: string
          applied_at?: string | null
          conversation_id: string
          created_at?: string
          error?: string | null
          id?: string
          input_text?: string
          parameters?: Json
          requested_by_phone_e164: string
          result?: Json
          status?: string
          tenant_id?: string | null
        }
        Update: {
          action_type?: string
          applied_at?: string | null
          conversation_id?: string
          created_at?: string
          error?: string | null
          id?: string
          input_text?: string
          parameters?: Json
          requested_by_phone_e164?: string
          result?: Json
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_customer_service_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "tenant_customer_service_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_customer_service_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_customer_service_contacts: {
        Row: {
          authorized_by_siteadmin_id: string | null
          contact_kind: string
          contact_ref_id: string | null
          created_at: string
          display_name: string | null
          enabled: boolean
          id: string
          permissions: Json
          phone_e164: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          authorized_by_siteadmin_id?: string | null
          contact_kind?: string
          contact_ref_id?: string | null
          created_at?: string
          display_name?: string | null
          enabled?: boolean
          id?: string
          permissions?: Json
          phone_e164: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          authorized_by_siteadmin_id?: string | null
          contact_kind?: string
          contact_ref_id?: string | null
          created_at?: string
          display_name?: string | null
          enabled?: boolean
          id?: string
          permissions?: Json
          phone_e164?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_customer_service_contact_authorized_by_siteadmin_id_fkey"
            columns: ["authorized_by_siteadmin_id"]
            isOneToOne: false
            referencedRelation: "siteadmin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_customer_service_contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_customer_service_conversations: {
        Row: {
          channel: string
          created_at: string
          id: string
          last_message_at: string
          metadata: Json
          pending_ticket_body: string | null
          pending_ticket_subject: string | null
          sender_phone_e164: string
          state: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          last_message_at?: string
          metadata?: Json
          pending_ticket_body?: string | null
          pending_ticket_subject?: string | null
          sender_phone_e164: string
          state?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          last_message_at?: string
          metadata?: Json
          pending_ticket_body?: string | null
          pending_ticket_subject?: string | null
          sender_phone_e164?: string
          state?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_customer_service_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_customer_service_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          message_id: string | null
          payload: Json
          sender_phone_e164: string | null
          tenant_id: string | null
        }
        Insert: {
          body?: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          message_id?: string | null
          payload?: Json
          sender_phone_e164?: string | null
          tenant_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          message_id?: string | null
          payload?: Json
          sender_phone_e164?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_customer_service_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "tenant_customer_service_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_customer_service_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_demo_controls: {
        Row: {
          backend_live: boolean
          created_at: string
          disabled_at: string | null
          enabled: boolean
          preview_slug: string
          tenant_id: string
          updated_at: string
          vertical: string
        }
        Insert: {
          backend_live?: boolean
          created_at?: string
          disabled_at?: string | null
          enabled?: boolean
          preview_slug: string
          tenant_id: string
          updated_at?: string
          vertical?: string
        }
        Update: {
          backend_live?: boolean
          created_at?: string
          disabled_at?: string | null
          enabled?: boolean
          preview_slug?: string
          tenant_id?: string
          updated_at?: string
          vertical?: string
        }
        Relationships: []
      }
      tenant_device_pins: {
        Row: {
          created_at: string
          device_type: string
          enabled: boolean
          id: string
          label: string
          pin_hash: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          device_type: string
          enabled?: boolean
          id?: string
          label?: string
          pin_hash: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          device_type?: string
          enabled?: boolean
          id?: string
          label?: string
          pin_hash?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_device_pins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_fidelity_earn_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["fidelity_earn_kind"]
          label: string
          params: Json
          priority: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["fidelity_earn_kind"]
          label: string
          params?: Json
          priority?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["fidelity_earn_kind"]
          label?: string
          params?: Json
          priority?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_fidelity_earn_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_fidelity_ledger: {
        Row: {
          created_at: string
          expired_points: number
          expires_at: string | null
          id: string
          member_id: string
          note: string | null
          order_id: string | null
          points: number
          redemption_id: string | null
          rule_id: string | null
          source: Database["public"]["Enums"]["fidelity_ledger_source"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          expired_points?: number
          expires_at?: string | null
          id?: string
          member_id: string
          note?: string | null
          order_id?: string | null
          points: number
          redemption_id?: string | null
          rule_id?: string | null
          source: Database["public"]["Enums"]["fidelity_ledger_source"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          expired_points?: number
          expires_at?: string | null
          id?: string
          member_id?: string
          note?: string | null
          order_id?: string | null
          points?: number
          redemption_id?: string | null
          rule_id?: string | null
          source?: Database["public"]["Enums"]["fidelity_ledger_source"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_fidelity_ledger_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "tenant_fidelity_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_fidelity_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_fidelity_ledger_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "tenant_fidelity_earn_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_fidelity_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_fidelity_members: {
        Row: {
          enrolled_at: string
          id: string
          is_active: boolean
          lifetime_earned: number
          lifetime_spent: number
          optin_ip: unknown
          optin_text: string
          optin_user_agent: string | null
          points_balance: number
          tenant_id: string
          user_id: string
        }
        Insert: {
          enrolled_at?: string
          id?: string
          is_active?: boolean
          lifetime_earned?: number
          lifetime_spent?: number
          optin_ip?: unknown
          optin_text: string
          optin_user_agent?: string | null
          points_balance?: number
          tenant_id: string
          user_id: string
        }
        Update: {
          enrolled_at?: string
          id?: string
          is_active?: boolean
          lifetime_earned?: number
          lifetime_spent?: number
          optin_ip?: unknown
          optin_text?: string
          optin_user_agent?: string | null
          points_balance?: number
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_fidelity_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_fidelity_programs: {
        Row: {
          created_at: string
          expiry_custom_date: string | null
          expiry_days: number | null
          expiry_kind: Database["public"]["Enums"]["fidelity_expiry_kind"]
          is_active: boolean
          optin_text: string
          points_label: string
          program_name: string
          tenant_id: string
          terms_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiry_custom_date?: string | null
          expiry_days?: number | null
          expiry_kind?: Database["public"]["Enums"]["fidelity_expiry_kind"]
          is_active?: boolean
          optin_text?: string
          points_label?: string
          program_name?: string
          tenant_id: string
          terms_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiry_custom_date?: string | null
          expiry_days?: number | null
          expiry_kind?: Database["public"]["Enums"]["fidelity_expiry_kind"]
          is_active?: boolean
          optin_text?: string
          points_label?: string
          program_name?: string
          tenant_id?: string
          terms_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_fidelity_programs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_fidelity_redemptions: {
        Row: {
          applied_at: string | null
          coupon_code: string | null
          created_at: string
          expires_at: string | null
          id: string
          member_id: string
          order_id: string | null
          points_spent: number
          reward_id: string
          reward_kind: Database["public"]["Enums"]["fidelity_reward_kind"]
          reward_payload: Json
          status: Database["public"]["Enums"]["fidelity_redemption_status"]
          tenant_id: string
        }
        Insert: {
          applied_at?: string | null
          coupon_code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          member_id: string
          order_id?: string | null
          points_spent: number
          reward_id: string
          reward_kind: Database["public"]["Enums"]["fidelity_reward_kind"]
          reward_payload: Json
          status?: Database["public"]["Enums"]["fidelity_redemption_status"]
          tenant_id: string
        }
        Update: {
          applied_at?: string | null
          coupon_code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          member_id?: string
          order_id?: string | null
          points_spent?: number
          reward_id?: string
          reward_kind?: Database["public"]["Enums"]["fidelity_reward_kind"]
          reward_payload?: Json
          status?: Database["public"]["Enums"]["fidelity_redemption_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_fidelity_redemptions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "tenant_fidelity_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_fidelity_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_fidelity_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "tenant_fidelity_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_fidelity_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_fidelity_rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["fidelity_reward_kind"]
          name: string
          payload: Json
          points_cost: number
          sort_order: number
          stock: number | null
          tenant_id: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["fidelity_reward_kind"]
          name: string
          payload?: Json
          points_cost: number
          sort_order?: number
          stock?: number | null
          tenant_id: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["fidelity_reward_kind"]
          name?: string
          payload?: Json
          points_cost?: number
          sort_order?: number
          stock?: number | null
          tenant_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_fidelity_rewards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_google_auth: {
        Row: {
          authorized_at: string
          authorized_by: string | null
          refresh_token: string
          tenant_id: string
        }
        Insert: {
          authorized_at?: string
          authorized_by?: string | null
          refresh_token: string
          tenant_id: string
        }
        Update: {
          authorized_at?: string
          authorized_by?: string | null
          refresh_token?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_google_auth_tenant_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_google_locations: {
        Row: {
          id: string
          is_primary: boolean
          linked_at: string
          location_id: string | null
          location_name: string | null
          location_resource_name: string
          place_id: string | null
          tenant_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean
          linked_at?: string
          location_id?: string | null
          location_name?: string | null
          location_resource_name: string
          place_id?: string | null
          tenant_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean
          linked_at?: string
          location_id?: string | null
          location_name?: string | null
          location_resource_name?: string
          place_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_google_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_google_locations_tenant_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_order_sequences: {
        Row: {
          last_seq: number
          tenant_id: string
        }
        Insert: {
          last_seq?: number
          tenant_id: string
        }
        Update: {
          last_seq?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_order_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_order_settings: {
        Row: {
          auto_accept_enabled: boolean
          auto_accept_max_items: number | null
          auto_accept_max_total: number | null
          auto_accept_min_notice_minutes: number | null
          auto_accept_no_notes: boolean
          auto_accept_only_returning: boolean
          created_at: string
          delivery_enabled: boolean | null
          delivery_window_before_close_min: number | null
          delivery_window_before_open_min: number | null
          dine_in_enabled: boolean
          dine_in_window_before_close_min: number | null
          dine_in_window_before_open_min: number | null
          id: string
          location_id: string | null
          pending_timeout_seconds: number
          takeaway_enabled: boolean
          takeaway_window_before_close_min: number | null
          takeaway_window_before_open_min: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_accept_enabled?: boolean
          auto_accept_max_items?: number | null
          auto_accept_max_total?: number | null
          auto_accept_min_notice_minutes?: number | null
          auto_accept_no_notes?: boolean
          auto_accept_only_returning?: boolean
          created_at?: string
          delivery_enabled?: boolean | null
          delivery_window_before_close_min?: number | null
          delivery_window_before_open_min?: number | null
          dine_in_enabled?: boolean
          dine_in_window_before_close_min?: number | null
          dine_in_window_before_open_min?: number | null
          id?: string
          location_id?: string | null
          pending_timeout_seconds?: number
          takeaway_enabled?: boolean
          takeaway_window_before_close_min?: number | null
          takeaway_window_before_open_min?: number | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_accept_enabled?: boolean
          auto_accept_max_items?: number | null
          auto_accept_max_total?: number | null
          auto_accept_min_notice_minutes?: number | null
          auto_accept_no_notes?: boolean
          auto_accept_only_returning?: boolean
          created_at?: string
          delivery_enabled?: boolean | null
          delivery_window_before_close_min?: number | null
          delivery_window_before_open_min?: number | null
          dine_in_enabled?: boolean
          dine_in_window_before_close_min?: number | null
          dine_in_window_before_open_min?: number | null
          id?: string
          location_id?: string | null
          pending_timeout_seconds?: number
          takeaway_enabled?: boolean
          takeaway_window_before_close_min?: number | null
          takeaway_window_before_open_min?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_order_settings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_order_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_overrides: {
        Row: {
          enabled: boolean | null
          features: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          enabled?: boolean | null
          features?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          enabled?: boolean | null
          features?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_special_hours: {
        Row: {
          closed: boolean
          created_at: string
          date: string
          end_date: string | null
          id: string
          kind: string
          label: string | null
          location_id: string | null
          slots: Json
          synced_to_google: boolean
          tenant_id: string
          weekday: number | null
        }
        Insert: {
          closed?: boolean
          created_at?: string
          date: string
          end_date?: string | null
          id?: string
          kind?: string
          label?: string | null
          location_id?: string | null
          slots?: Json
          synced_to_google?: boolean
          tenant_id: string
          weekday?: number | null
        }
        Update: {
          closed?: boolean
          created_at?: string
          date?: string
          end_date?: string | null
          id?: string
          kind?: string
          label?: string | null
          location_id?: string | null
          slots?: Json
          synced_to_google?: boolean
          tenant_id?: string
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_special_hours_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_special_hours_tenant_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_whatsapp_sessions: {
        Row: {
          alert_email_sent_at: string | null
          alert_reason: string | null
          created_at: string
          id: string
          last_connected_at: string | null
          last_error: string | null
          last_heartbeat_at: string | null
          metadata: Json
          phone_e164: string | null
          qr_data_url: string | null
          qr_updated_at: string | null
          session_id: string
          session_kind: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          alert_email_sent_at?: string | null
          alert_reason?: string | null
          created_at?: string
          id?: string
          last_connected_at?: string | null
          last_error?: string | null
          last_heartbeat_at?: string | null
          metadata?: Json
          phone_e164?: string | null
          qr_data_url?: string | null
          qr_updated_at?: string | null
          session_id: string
          session_kind?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          alert_email_sent_at?: string | null
          alert_reason?: string | null
          created_at?: string
          id?: string
          last_connected_at?: string | null
          last_error?: string | null
          last_heartbeat_at?: string | null
          metadata?: Json
          phone_e164?: string | null
          qr_data_url?: string | null
          qr_updated_at?: string | null
          session_id?: string
          session_kind?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_whatsapp_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenantadmin: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          enabled: boolean
          first_name: string | null
          id: string
          invited_by: string | null
          last_name: string | null
          preferred_language: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          enabled?: boolean
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_name?: string | null
          preferred_language?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          enabled?: boolean
          first_name?: string | null
          id?: string
          invited_by?: string | null
          last_name?: string | null
          preferred_language?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenantadmin_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenantadmin_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          domains: string[]
          enabled: boolean
          features: Json
          hours: Json
          id: string
          label: string
          name: string
          preview_slug: string | null
          site_config: Json
          status: string
          theme: Json
          updated_at: string
          vertical: string
        }
        Insert: {
          created_at?: string
          domains?: string[]
          enabled?: boolean
          features?: Json
          hours?: Json
          id: string
          label: string
          name: string
          preview_slug?: string | null
          site_config?: Json
          status?: string
          theme?: Json
          updated_at?: string
          vertical?: string
        }
        Update: {
          created_at?: string
          domains?: string[]
          enabled?: boolean
          features?: Json
          hours?: Json
          id?: string
          label?: string
          name?: string
          preview_slug?: string | null
          site_config?: Json
          status?: string
          theme?: Json
          updated_at?: string
          vertical?: string
        }
        Relationships: []
      }
      time_off_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          notes: string | null
          requester_auth_user_id: string
          start_date: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          notes?: string | null
          requester_auth_user_id: string
          start_date: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          notes?: string | null
          requester_auth_user_id?: string
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          birth_date: string | null
          consumer_enabled: boolean
          diet_notes: string | null
          is_vegetarian: boolean
          marketing_opt_in: boolean
          preferred_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          consumer_enabled?: boolean
          diet_notes?: string | null
          is_vegetarian?: boolean
          marketing_opt_in?: boolean
          preferred_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          consumer_enabled?: boolean
          diet_notes?: string | null
          is_vegetarian?: boolean
          marketing_opt_in?: boolean
          preferred_language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tenant_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tenant_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          birth_date: string | null
          diet_notes: string | null
          is_vegetarian: boolean
          marketing_opt_in: boolean
          preferred_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          diet_notes?: string | null
          is_vegetarian?: boolean
          marketing_opt_in?: boolean
          preferred_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          diet_notes?: string | null
          is_vegetarian?: boolean
          marketing_opt_in?: boolean
          preferred_language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_admin_tenant: { Args: { t: string }; Returns: boolean }
      create_tenant_with_location: {
        Args: {
          p_address: string
          p_city?: string
          p_domains: string[]
          p_email?: string
          p_features: Json
          p_label: string
          p_location_name: string
          p_location_slug: string
          p_name: string
          p_phone?: string
          p_preview_slug: string
          p_status: string
          p_tenant_id: string
          p_theme: Json
          p_vertical: string
        }
        Returns: {
          location_id: string
          tenant_id: string
        }[]
      }
      current_user_tenant: { Args: never; Returns: string }
      cust_staff_check: { Args: never; Returns: boolean }
      expire_pending_orders: { Args: never; Returns: number }
      generate_siteadmin_aliases: { Args: { p_id: string }; Returns: undefined }
      is_platform_admin: { Args: never; Returns: boolean }
      is_siteadmin: { Args: never; Returns: boolean }
      next_order_code: {
        Args: { p_prefix?: string; p_tenant_id: string }
        Returns: string
      }
      platform_suspend_overdue_tenants: { Args: never; Returns: number }
      resolve_order_settings: {
        Args: { p_location_id: string; p_tenant_id: string }
        Returns: {
          auto_accept_enabled: boolean
          auto_accept_max_items: number | null
          auto_accept_max_total: number | null
          auto_accept_no_notes: boolean
          auto_accept_only_returning: boolean
          created_at: string
          delivery_enabled: boolean | null
          delivery_window_before_close_min: number | null
          delivery_window_before_open_min: number | null
          dine_in_enabled: boolean
          dine_in_window_before_close_min: number | null
          dine_in_window_before_open_min: number | null
          id: string
          location_id: string | null
          pending_timeout_seconds: number
          takeaway_enabled: boolean
          takeaway_window_before_close_min: number | null
          takeaway_window_before_open_min: number | null
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tenant_order_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_tenant_access: {
        Args: { p_employee_id: string; p_revoker_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      admin_role:
        | "platform_admin"
        | "tenant_admin"
        | "staff"
        | "kitchen"
        | "titolare"
        | "manager"
        | "chef"
        | "cameriere"
        | "personale_cucina"
        | "kitdisplay"
        | "kiosk"
        | "superadmin"
        | "admin"
        | "venditore"
        | "amministrazione"
        | "gestore"
      employee_role:
        | "manager"
        | "chef"
        | "cameriere"
        | "personale_cucina"
        | "kitdisplay"
        | "kiosk"
      fidelity_earn_kind:
        | "signup_bonus"
        | "per_euro_spent"
        | "per_order_count"
        | "day_of_week_bonus"
        | "date_range_bonus"
      fidelity_expiry_kind:
        | "never"
        | "yearly_dec31"
        | "custom_date"
        | "days_from_accrual"
      fidelity_ledger_source:
        | "signup"
        | "order_earn"
        | "rule_bonus"
        | "redemption"
        | "expiry"
        | "manual_adjustment"
        | "refund"
      fidelity_redemption_status:
        | "pending"
        | "applied"
        | "expired"
        | "refunded"
        | "cancelled"
      fidelity_reward_kind:
        | "order_discount_amount"
        | "free_product"
        | "external_coupon_code"
        | "category_percent_discount"
      order_status:
        | "nuovo"
        | "in_preparazione"
        | "pronto"
        | "consegnato"
        | "annullato"
        | "pending_confirmation"
        | "expired"
      order_type: "tavolo" | "asporto"
      price_kind: "single" | "sized" | "persone" | "volume"
      session_status: "aperta" | "chiusa"
      siteadmin_role:
        | "superadmin"
        | "admin"
        | "venditore"
        | "amministrazione"
        | "gestore"
        | "lead_inserter"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      admin_role: [
        "platform_admin",
        "tenant_admin",
        "staff",
        "kitchen",
        "titolare",
        "manager",
        "chef",
        "cameriere",
        "personale_cucina",
        "kitdisplay",
        "kiosk",
        "superadmin",
        "admin",
        "venditore",
        "amministrazione",
        "gestore",
      ],
      employee_role: [
        "manager",
        "chef",
        "cameriere",
        "personale_cucina",
        "kitdisplay",
        "kiosk",
      ],
      fidelity_earn_kind: [
        "signup_bonus",
        "per_euro_spent",
        "per_order_count",
        "day_of_week_bonus",
        "date_range_bonus",
      ],
      fidelity_expiry_kind: [
        "never",
        "yearly_dec31",
        "custom_date",
        "days_from_accrual",
      ],
      fidelity_ledger_source: [
        "signup",
        "order_earn",
        "rule_bonus",
        "redemption",
        "expiry",
        "manual_adjustment",
        "refund",
      ],
      fidelity_redemption_status: [
        "pending",
        "applied",
        "expired",
        "refunded",
        "cancelled",
      ],
      fidelity_reward_kind: [
        "order_discount_amount",
        "free_product",
        "external_coupon_code",
        "category_percent_discount",
      ],
      order_status: [
        "nuovo",
        "in_preparazione",
        "pronto",
        "consegnato",
        "annullato",
        "pending_confirmation",
        "expired",
      ],
      order_type: ["tavolo", "asporto"],
      price_kind: ["single", "sized", "persone", "volume"],
      session_status: ["aperta", "chiusa"],
      siteadmin_role: [
        "superadmin",
        "admin",
        "venditore",
        "amministrazione",
        "gestore",
        "lead_inserter",
      ],
    },
  },
} as const
