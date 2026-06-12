export type NewsletterSubscriberStatus = "active" | "unsubscribed" | "bounced" | "complained";
export type NewsletterMessageKind = "campaign" | "automation";
export type NewsletterMessageStatus = "draft" | "scheduled" | "active" | "paused" | "sending" | "sent";

export type NewsletterSubscriber = {
  id: string;
  tenantId: string;
  email: string;
  name: string | null;
  locale: string;
  source: string;
  status: NewsletterSubscriberStatus;
  tags: string[];
  consentAt: string;
  unsubscribedAt: string | null;
  createdAt: string;
};

export type NewsletterMessage = {
  id: string;
  tenantId: string;
  kind: NewsletterMessageKind;
  name: string;
  status: NewsletterMessageStatus;
  triggerKey: string | null;
  delayMinutes: number;
  subject: string;
  preheader: string | null;
  bodyHtml: string;
  fromName: string | null;
  replyTo: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterDelivery = {
  id: string;
  messageId: string;
  recipientEmail: string;
  status: string;
  openCount: number;
  clickCount: number;
  lastClickedUrl: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type NewsletterUnsubscribe = {
  id: string;
  email: string;
  reasonCode: string | null;
  reasonText: string | null;
  createdAt: string;
};

export type NewsletterDashboardData = {
  subscribers: NewsletterSubscriber[];
  messages: NewsletterMessage[];
  deliveries: NewsletterDelivery[];
  unsubscribes: NewsletterUnsubscribe[];
  metrics: {
    activeSubscribers: number;
    unsubscribed: number;
    sent: number;
    delivered: number;
    uniqueOpens: number;
    uniqueClicks: number;
    openRate: number;
    clickRate: number;
  };
};
