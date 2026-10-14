export type OutreachCampaignStatus = "draft" | "active" | "paused" | "completed";
export type OutreachLeadStatus =
  | "ready" | "active" | "replied" | "booked" | "won" | "lost"
  | "unsubscribed" | "bounced" | "paused";

export type OutreachCampaign = {
  id: string;
  name: string;
  status: OutreachCampaignStatus;
  video_url: string | null;
  booking_url: string;
  sender_name: string;
  reply_to: string;
  daily_limit: number;
  created_at: string;
  updated_at: string;
};

export type OutreachStep = {
  id: string;
  campaign_id: string;
  position: number;
  name: string;
  delay_days: number;
  subject: string;
  body_text: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type OutreachLead = {
  id: string;
  campaign_id: string;
  crm_contact_id: string | null;
  public_token: string;
  contact_name: string;
  restaurant_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  website_url: string | null;
  image_url: string | null;
  observation: string | null;
  headline: string | null;
  primary_pain: string | null;
  status: OutreachLeadStatus;
  current_step: number;
  next_send_at: string | null;
  last_sent_at: string | null;
  sent_count: number;
  opened_at: string | null;
  clicked_at: string | null;
  landing_viewed_at: string | null;
  video_clicked_at: string | null;
  booked_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
};

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type OutreachDatabase = {
  public: {
    Tables: {
      menuary_outreach_campaigns: Table<OutreachCampaign>;
      menuary_outreach_steps: Table<OutreachStep>;
      menuary_outreach_leads: Table<OutreachLead>;
      menuary_outreach_events: Table<{
        id: number;
        lead_id: string;
        event_type: string;
        step_position: number | null;
        provider_message_id: string | null;
        metadata: Record<string, unknown>;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type OutreachDashboard = {
  campaign: OutreachCampaign | null;
  campaigns: OutreachCampaign[];
  steps: OutreachStep[];
  leads: OutreachLead[];
  stats: {
    total: number;
    active: number;
    sent: number;
    landingViews: number;
    videoClicks: number;
    bookingClicks: number;
    replies: number;
    booked: number;
    won: number;
    unsubscribed: number;
  };
};
