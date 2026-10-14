import type { OutreachCampaign, OutreachLead, OutreachStep } from "./types";

const HTML_ESCAPE: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };

export function outreachLandingUrl(token: string): string {
  const origin = process.env.NEXT_PUBLIC_MENUARY_ORIGIN ?? "https://menuary.it";
  return `${origin.replace(/\/$/, "")}/presentazione/${token}`;
}

export function outreachBookingUrl(campaign: OutreachCampaign, lead: OutreachLead): string {
  const url = new URL(campaign.booking_url);
  url.searchParams.set("utm_source", "menuary-outreach");
  url.searchParams.set("utm_campaign", campaign.id);
  url.searchParams.set("utm_content", `menuary-outreach:${lead.public_token}`);
  return url.toString();
}

export function renderOutreachCopy(template: string, campaign: OutreachCampaign, lead: OutreachLead): string {
  const values: Record<string, string> = {
    contact_name: lead.contact_name,
    restaurant_name: lead.restaurant_name,
    city: lead.city ?? "",
    observation: lead.observation ?? "ho pensato che la vostra presenza online possa essere valorizzata ancora meglio",
    landing_url: outreachLandingUrl(lead.public_token),
    booking_url: outreachBookingUrl(campaign, lead),
    sender_name: campaign.sender_name,
  };
  return template.replace(/{{([a-z_]+)}}/g, (_, key: string) => values[key] ?? "");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE[char]);
}

export function outreachEmailHtml(campaign: OutreachCampaign, lead: OutreachLead, step: OutreachStep): string {
  const text = renderOutreachCopy(step.body_text, campaign, lead);
  const linked = escapeHtml(text).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#b8332e;text-decoration:underline">$1</a>',
  );
  const unsubscribe = `${outreachLandingUrl(lead.public_token)}/disiscriviti`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#211b19;max-width:620px">${linked.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}<p style="margin-top:28px;font-size:11px;color:#806f68">Non vuoi ricevere altri messaggi? <a href="${unsubscribe}" style="color:#806f68">Disiscriviti</a>.</p></div>`;
}
