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
  public: {
    Tables: {
      cash_sessions: {
        Row: {
          id: string
          tenant_id: string
          location_id: string | null
          opened_at: string
          closed_at: string | null
          opened_by: string | null
          closed_by: string | null
          opening_amount: number
          closing_amount: number | null
          expected_amount: number | null
          status: string
          note: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          location_id?: string | null
          opened_at?: string
          closed_at?: string | null
          opened_by?: string | null
          closed_by?: string | null
          opening_amount?: number
          closing_amount?: number | null
          expected_amount?: number | null
          status?: string
          note?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          location_id?: string | null
          opened_at?: string
          closed_at?: string | null
          opened_by?: string | null
          closed_by?: string | null
          opening_amount?: number
          closing_amount?: number | null
          expected_amount?: number | null
          status?: string
          note?: string | null
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          id: string
          tenant_id: string
          session_id: string
          order_id: string | null
          kind: string
          method: string
          amount: number
          note: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          session_id: string
          order_id?: string | null
          kind: string
          method?: string
          amount: number
          note?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          session_id?: string
          order_id?: string | null
          kind?: string
          method?: string
          amount?: number
          note?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      kiosk_devices: {
        Row: {
          id: string
          tenant_id: string
          location_id: string | null
          name: string
          pairing_code: string
          device_token: string | null
          enabled: boolean
          paired_at: string | null
          last_seen_at: string | null
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          location_id?: string | null
          name: string
          pairing_code: string
          device_token?: string | null
          enabled?: boolean
          paired_at?: string | null
          last_seen_at?: string | null
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          location_id?: string | null
          name?: string
          pairing_code?: string
          device_token?: string | null
          enabled?: boolean
          paired_at?: string | null
          last_seen_at?: string | null
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          id: string
          tenant_id: string
          location_id: string | null
          employee_id: string
          start_at: string
          end_at: string
          role: string | null
          status: string
          note: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          location_id?: string | null
          employee_id: string
          start_at: string
          end_at: string
          role?: string | null
          status?: string
          note?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          location_id?: string | null
          employee_id?: string
          start_at?: string
          end_at?: string
          role?: string | null
          status?: string
          note?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      sent_emails: {
        Row: {
          id: string
          created_at: string
          resend_message_id: string | null
          from_address: string
          from_name: string | null
          to_addresses: string[]
          subject: string
          html_body: string | null
          brand: "menuary" | "bizery" | "orpheo"
          sent_by_user_id: string | null
          sent_by_name: string | null
          status: "sent" | "delivered" | "delivery_delayed" | "bounced" | "complained"
          lead_id: string | null
          tenant_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          resend_message_id?: string | null
          from_address: string
          from_name?: string | null
          to_addresses: string[]
          subject?: string
          html_body?: string | null
          brand: "menuary" | "bizery" | "orpheo"
          sent_by_user_id?: string | null
          sent_by_name?: string | null
          status?: "sent" | "delivered" | "delivery_delayed" | "bounced" | "complained"
          lead_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          resend_message_id?: string | null
          from_address?: string
          from_name?: string | null
          to_addresses?: string[]
          subject?: string
          html_body?: string | null
          brand?: "menuary" | "bizery" | "orpheo"
          sent_by_user_id?: string | null
          sent_by_name?: string | null
          status?: "sent" | "delivered" | "delivery_delayed" | "bounced" | "complained"
          lead_id?: string | null
          tenant_id?: string | null
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
      email_tracking_events: {
        Row: {
          id: string
          created_at: string
          resend_email_id: string
          event_type: string
          from_address: string | null
          to_address: string | null
          subject: string | null
          brand: "menuary" | "bizery" | "orpheo" | null
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          resend_email_id: string
          event_type: string
          from_address?: string | null
          to_address?: string | null
          subject?: string | null
          brand?: "menuary" | "bizery" | "orpheo" | null
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          resend_email_id?: string
          event_type?: string
          from_address?: string | null
          to_address?: string | null
          subject?: string | null
          brand?: "menuary" | "bizery" | "orpheo" | null
          metadata?: Json
        }
        Relationships: []
      }
      email_signatures: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          brand: "menuary" | "bizery" | "orpheo"
          name: string
          title: string
          phone: string
          email: string
          website: string
          html: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          brand: "menuary" | "bizery" | "orpheo"
          name?: string
          title?: string
          phone?: string
          email?: string
          website?: string
          html?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          brand?: "menuary" | "bizery" | "orpheo"
          name?: string
          title?: string
          phone?: string
          email?: string
          website?: string
          html?: string
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
        Relationships: []
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
        Relationships: []
      }
      hubrise_inbound_log: {
        Row: {
          id: string
          received_at: string
          event: string | null
          hubrise_location_id: string | null
          resource_id: string | null
          status: string
          reason: string | null
          payload: Json | null
          signature: string | null
          resolved: boolean
          resolved_at: string | null
        }
        Insert: {
          id?: string
          received_at?: string
          event?: string | null
          hubrise_location_id?: string | null
          resource_id?: string | null
          status: string
          reason?: string | null
          payload?: Json | null
          signature?: string | null
          resolved?: boolean
          resolved_at?: string | null
        }
        Update: {
          id?: string
          received_at?: string
          event?: string | null
          hubrise_location_id?: string | null
          resource_id?: string | null
          status?: string
          reason?: string | null
          payload?: Json | null
          signature?: string | null
          resolved?: boolean
          resolved_at?: string | null
        }
        Relationships: []
      }
      inbound_emails: {
        Row: {
          id: string
          created_at: string
          message_id: string | null
          from_address: string
          from_name: string | null
          to_addresses: string[]
          subject: string
          text_body: string | null
          html_body: string | null
          headers: Json
          attachments: Json
          brand: "menuary" | "bizery" | "orpheo"
          read: boolean
          starred: boolean
          archived: boolean
          lead_id: string | null
          assigned_to_user_id: string | null
          tenant_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          message_id?: string | null
          from_address: string
          from_name?: string | null
          to_addresses: string[]
          subject?: string
          text_body?: string | null
          html_body?: string | null
          headers?: Json
          attachments?: Json
          brand: "menuary" | "bizery" | "orpheo"
          read?: boolean
          starred?: boolean
          archived?: boolean
          lead_id?: string | null
          assigned_to_user_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          message_id?: string | null
          from_address?: string
          from_name?: string | null
          to_addresses?: string[]
          subject?: string
          text_body?: string | null
          html_body?: string | null
          headers?: Json
          attachments?: Json
          brand?: "menuary" | "bizery" | "orpheo"
          read?: boolean
          starred?: boolean
          archived?: boolean
          lead_id?: string | null
          assigned_to_user_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbound_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "platform_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_emails_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "siteadmin"
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
      siteadmin_email_aliases: {
        Row: {
          id: string
          siteadmin_id: string
          alias: string
          alias_type: "email_prefix" | "name_variant" | "legacy_name"
          created_at: string
        }
        Insert: {
          id?: string
          siteadmin_id: string
          alias: string
          alias_type: "email_prefix" | "name_variant" | "legacy_name"
          created_at?: string
        }
        Update: {
          id?: string
          siteadmin_id?: string
          alias?: string
          alias_type?: "email_prefix" | "name_variant" | "legacy_name"
          created_at?: string
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
      admin_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          display_name: string | null
          email: string
          enabled: boolean
          id: string
          invited_by: string | null
          permissions: Json
          role: Database["public"]["Enums"]["admin_role"]
          tenant_id: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          enabled?: boolean
          id?: string
          invited_by?: string | null
          permissions?: Json
          role?: Database["public"]["Enums"]["admin_role"]
          tenant_id?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          enabled?: boolean
          id?: string
          invited_by?: string | null
          permissions?: Json
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
      employee: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          enabled: boolean
          id: string
          invited_by: string | null
          permissions: Json
          role: Database["public"]["Enums"]["employee_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          enabled?: boolean
          id?: string
          invited_by?: string | null
          permissions?: Json
          role?: Database["public"]["Enums"]["employee_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          enabled?: boolean
          id?: string
          invited_by?: string | null
          permissions?: Json
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
      locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
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
          variant_groups: Json
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
          variant_groups?: Json
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
          variant_groups?: Json
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
          auto_accepted: boolean | null
          code: string
          confirmation_expires_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          dine_option: string | null
          diner_client_id: string | null
          diner_nickname: string | null
          external_order_id: string | null
          external_payload: Json | null
          external_platform: string | null
          id: string
          location_id: string | null
          menuary_user_id: string | null
          notes: string | null
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
          auto_accepted?: boolean | null
          code: string
          confirmation_expires_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          dine_option?: string | null
          diner_client_id?: string | null
          diner_nickname?: string | null
          external_order_id?: string | null
          external_payload?: Json | null
          external_platform?: string | null
          id?: string
          location_id?: string | null
          menuary_user_id?: string | null
          notes?: string | null
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
          auto_accepted?: boolean | null
          code?: string
          confirmation_expires_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          dine_option?: string | null
          diner_client_id?: string | null
          diner_nickname?: string | null
          external_order_id?: string | null
          external_payload?: Json | null
          external_platform?: string | null
          id?: string
          location_id?: string | null
          menuary_user_id?: string | null
          notes?: string | null
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
          business_vertical: string
          city: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          converted_at: string | null
          country: string
          created_at: string
          id: string
          notes: string | null
          postal_code: string | null
          province: string | null
          source: string | null
          status: string
          tenant_id: string | null
          updated_at: string
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
          business_vertical?: string
          city?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          converted_at?: string | null
          country?: string
          created_at?: string
          id?: string
          notes?: string | null
          postal_code?: string | null
          province?: string | null
          source?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
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
          business_vertical?: string
          city?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          converted_at?: string | null
          country?: string
          created_at?: string
          id?: string
          notes?: string | null
          postal_code?: string | null
          province?: string | null
          source?: string | null
          status?: string
          tenant_id?: string | null
          updated_at?: string
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
      platform_packages: {
        Row: {
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
          modules: string[]
          name: string
          price_monthly: number
          price_monthly_billing: number | null
          price_yearly: number | null
          setup_from: string | null
          slug: string
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
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
          modules?: string[]
          name: string
          price_monthly?: number
          price_monthly_billing?: number | null
          price_yearly?: number | null
          setup_from?: string | null
          slug: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
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
          modules?: string[]
          name?: string
          price_monthly?: number
          price_monthly_billing?: number | null
          price_yearly?: number | null
          setup_from?: string | null
          slug?: string
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_payments: {
        Row: {
          amount: number
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
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
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
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
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
      platform_subscriptions: {
        Row: {
          billing_cycle: string
          cancelled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          lead_id: string
          next_renewal_at: string | null
          notes: string | null
          package_id: string
          price_override: number | null
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
          id?: string
          lead_id: string
          next_renewal_at?: string | null
          notes?: string | null
          package_id: string
          price_override?: number | null
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
          id?: string
          lead_id?: string
          next_renewal_at?: string | null
          notes?: string | null
          package_id?: string
          price_override?: number | null
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
          translated: boolean
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
          translated?: boolean
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
          translated?: boolean
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
      tenant_order_settings: {
        Row: {
          auto_accept_enabled: boolean
          auto_accept_max_items: number | null
          auto_accept_max_total: number | null
          auto_accept_min_notice_minutes: number | null
          auto_accept_no_notes: boolean
          auto_accept_only_returning: boolean
          created_at: string
          delivery_enabled: boolean
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
          delivery_enabled?: boolean
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
          delivery_enabled?: boolean
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
            foreignKeyName: "tenant_order_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
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
          id: string
          label: string | null
          location_id: string | null
          slots: Json
          synced_to_google: boolean
          tenant_id: string
        }
        Insert: {
          closed?: boolean
          created_at?: string
          date: string
          id?: string
          label?: string | null
          location_id?: string | null
          slots?: Json
          synced_to_google?: boolean
          tenant_id: string
        }
        Update: {
          closed?: boolean
          created_at?: string
          date?: string
          id?: string
          label?: string | null
          location_id?: string | null
          slots?: Json
          synced_to_google?: boolean
          tenant_id?: string
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
      tenantadmin: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          enabled: boolean
          id: string
          invited_by: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          enabled?: boolean
          id?: string
          invited_by?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          enabled?: boolean
          id?: string
          invited_by?: string | null
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
      current_user_tenant: { Args: never; Returns: string }
      cust_staff_check: { Args: never; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_siteadmin: { Args: never; Returns: boolean }
      next_order_code: {
        Args: { p_prefix?: string; p_tenant_id: string }
        Returns: string
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
      order_status:
        | "pending_confirmation"
        | "nuovo"
        | "in_preparazione"
        | "pronto"
        | "consegnato"
        | "annullato"
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
      order_status: [
        "pending_confirmation",
        "nuovo",
        "in_preparazione",
        "pronto",
        "consegnato",
        "annullato",
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
