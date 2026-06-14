import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { normalizeWhatsappPhone } from "@/lib/tenant-support/admin-contacts";

type LeadVertical = "unknown" | "food" | "services" | "creative" | "other";

type QualificationProfile = {
  contactName: string | null;
  contactEmail: string | null;
  businessName: string | null;
  businessType: string | null;
  city: string | null;
  requestedServices: string[];
  painPoints: string[];
  generalNotes: string[];
  callInterest: boolean;
  callPreference: string | null;
};

type QualificationAnalysis = {
  vertical: LeadVertical;
  verticalConfidence: number;
  profile: QualificationProfile;
  summary: string;
  reply: string;
  conversationState: "qualifying" | "call_proposed" | "handed_off";
};

type ConversationRow = {
  id: string;
  lead_id: string | null;
  sender_phone_e164: string;
  state: "qualifying" | "call_proposed" | "handed_off" | "closed";
  inferred_vertical: LeadVertical;
  vertical_confidence: number;
  profile: unknown;
  summary: string | null;
};

type LeadRow = {
  id: string;
  business_name: string;
  business_vertical: string;
  business_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  city: string | null;
  notes: string | null;
  status: string;
  stage: string;
  temperature: string;
  tenant_id: string | null;
  requested_services: string[] | null;
  pain_points: string[] | null;
  whatsapp_qualification: unknown;
};

export type PlatformWhatsappLeadInput = {
  from: string;
  text: string;
  messageId?: string | null;
  payload?: unknown;
};

const EMPTY_PROFILE: QualificationProfile = {
  contactName: null,
  contactEmail: null,
  businessName: null,
  businessType: null,
  city: null,
  requestedServices: [],
  painPoints: [],
  generalNotes: [],
  callInterest: false,
  callPreference: null,
};

const QUALIFICATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "vertical",
    "verticalConfidence",
    "profile",
    "summary",
    "reply",
    "conversationState",
  ],
  properties: {
    vertical: {
      type: "string",
      enum: ["unknown", "food", "services", "creative", "other"],
    },
    verticalConfidence: { type: "number", minimum: 0, maximum: 1 },
    profile: {
      type: "object",
      additionalProperties: false,
      required: [
        "contactName",
        "contactEmail",
        "businessName",
        "businessType",
        "city",
        "requestedServices",
        "painPoints",
        "generalNotes",
        "callInterest",
        "callPreference",
      ],
      properties: {
        contactName: { type: ["string", "null"] },
        contactEmail: { type: ["string", "null"] },
        businessName: { type: ["string", "null"] },
        businessType: { type: ["string", "null"] },
        city: { type: ["string", "null"] },
        requestedServices: { type: "array", items: { type: "string" } },
        painPoints: { type: "array", items: { type: "string" } },
        generalNotes: { type: "array", items: { type: "string" } },
        callInterest: { type: "boolean" },
        callPreference: { type: ["string", "null"] },
      },
    },
    summary: { type: "string" },
    reply: { type: "string" },
    conversationState: {
      type: "string",
      enum: ["qualifying", "call_proposed", "handed_off"],
    },
  },
} as const;

function db() {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("supabase_service_unconfigured");
  return client as any;
}

function cleanText(value: unknown, maxLength = 500): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/\s+/g, " ");
  return clean ? clean.slice(0, maxLength) : null;
}

function cleanList(value: unknown, maxItems = 12): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    const clean = cleanText(item, 180);
    if (!clean) continue;
    const key = clean.toLocaleLowerCase("it");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
    if (result.length >= maxItems) break;
  }
  return result;
}

function normalizeProfile(value: unknown): QualificationProfile {
  const profile = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    contactName: cleanText(profile.contactName, 160),
    contactEmail: cleanText(profile.contactEmail, 240)?.toLowerCase() ?? null,
    businessName: cleanText(profile.businessName, 200),
    businessType: cleanText(profile.businessType, 160),
    city: cleanText(profile.city, 120),
    requestedServices: cleanList(profile.requestedServices),
    painPoints: cleanList(profile.painPoints),
    generalNotes: cleanList(profile.generalNotes),
    callInterest: profile.callInterest === true,
    callPreference: cleanText(profile.callPreference, 200),
  };
}

function profileWithLeadData(value: unknown, lead: LeadRow): QualificationProfile {
  const current = normalizeProfile(value);
  const stored = normalizeProfile(lead.whatsapp_qualification);
  const businessName = /^Contatto WhatsApp\b/i.test(lead.business_name)
    ? null
    : lead.business_name;
  return {
    contactName: current.contactName ?? stored.contactName ?? lead.contact_name,
    contactEmail: current.contactEmail ?? stored.contactEmail ?? lead.contact_email,
    businessName: current.businessName ?? stored.businessName ?? businessName,
    businessType: current.businessType ?? stored.businessType ?? lead.business_type,
    city: current.city ?? stored.city ?? lead.city,
    requestedServices: current.requestedServices.length
      ? current.requestedServices
      : stored.requestedServices.length
        ? stored.requestedServices
        : lead.requested_services ?? [],
    painPoints: current.painPoints.length
      ? current.painPoints
      : stored.painPoints.length
        ? stored.painPoints
        : lead.pain_points ?? [],
    generalNotes: current.generalNotes.length ? current.generalNotes : stored.generalNotes,
    callInterest: current.callInterest || stored.callInterest,
    callPreference: current.callPreference ?? stored.callPreference,
  };
}

function mergeProfiles(baseValue: unknown, incomingValue: unknown): QualificationProfile {
  const base = normalizeProfile(baseValue);
  const incoming = normalizeProfile(incomingValue);
  return {
    contactName: incoming.contactName ?? base.contactName,
    contactEmail: incoming.contactEmail ?? base.contactEmail,
    businessName: incoming.businessName ?? base.businessName,
    businessType: incoming.businessType ?? base.businessType,
    city: incoming.city ?? base.city,
    requestedServices: cleanList([...base.requestedServices, ...incoming.requestedServices]),
    painPoints: cleanList([...base.painPoints, ...incoming.painPoints]),
    generalNotes: cleanList([...base.generalNotes, ...incoming.generalNotes]),
    callInterest: base.callInterest || incoming.callInterest,
    callPreference: incoming.callPreference ?? base.callPreference,
  };
}

function parseOpenAIResponseText(value: unknown): string {
  const response = value as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (typeof response.output_text === "string") return response.output_text;
  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function normalizeAnalysis(value: unknown): QualificationAnalysis | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const parsed = value as Record<string, unknown>;
  const verticals: LeadVertical[] = ["unknown", "food", "services", "creative", "other"];
  const states: QualificationAnalysis["conversationState"][] = ["qualifying", "call_proposed", "handed_off"];
  const vertical = verticals.includes(parsed.vertical as LeadVertical)
    ? parsed.vertical as LeadVertical
    : "unknown";
  const confidence = typeof parsed.verticalConfidence === "number" && Number.isFinite(parsed.verticalConfidence)
    ? Math.max(0, Math.min(1, parsed.verticalConfidence))
    : 0;
  const reply = cleanText(parsed.reply, 1200);
  if (!reply) return null;
  return {
    vertical,
    verticalConfidence: confidence,
    profile: normalizeProfile(parsed.profile),
    summary: cleanText(parsed.summary, 2000) ?? "",
    reply,
    conversationState: states.includes(parsed.conversationState as QualificationAnalysis["conversationState"])
      ? parsed.conversationState as QualificationAnalysis["conversationState"]
      : "qualifying",
  };
}

function brandForVertical(vertical: LeadVertical): string {
  if (vertical === "food") return "Menuary";
  if (vertical === "services") return "Bizery";
  if (vertical === "creative") return "Orpheo";
  if (vertical === "other") return "Studio / altro";
  return "Da qualificare";
}

function fallbackAnalysis(
  profileValue: unknown,
  currentVertical: LeadVertical = "unknown",
  currentConfidence = 0,
  currentSummary = "",
): QualificationAnalysis {
  const profile = normalizeProfile(profileValue);
  const hasActivity = Boolean(profile.businessType || profile.businessName);
  const hasNeed = profile.requestedServices.length > 0 || profile.painPoints.length > 0;
  const reply = !hasActivity
    ? "Ciao! Raccontami brevemente di cosa ti occupi e che risultato vorresti ottenere: così ti do informazioni pertinenti senza farti perdere tempo."
    : !hasNeed
      ? "Chiaro. Qual è oggi il problema principale che vorresti risolvere, per esempio presenza online, gestione richieste, prenotazioni, vendite o lavoro operativo?"
      : "Grazie, ho un quadro iniziale. Posso approfondire la soluzione più adatta e, se ha senso, organizziamo una breve chiamata: come preferisci proseguire?";
  return {
    vertical: currentVertical,
    verticalConfidence: currentConfidence,
    profile,
    summary: currentSummary,
    reply,
    conversationState: hasNeed ? "call_proposed" : "qualifying",
  };
}

async function analyzeWithAi(params: {
  profile: unknown;
  currentVertical: LeadVertical;
  currentConfidence: number;
  summary: string | null;
  messages: Array<{ direction: "inbound" | "outbound"; body: string }>;
}): Promise<QualificationAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackAnalysis(
      params.profile,
      params.currentVertical,
      params.currentConfidence,
      params.summary ?? "",
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_WHATSAPP_LEAD_MODEL || process.env.OPENAI_WHATSAPP_MODEL || "gpt-5-mini",
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: [
              "Sei il consulente commerciale WhatsApp di uno studio che usa un unico numero per quattro ambiti.",
              "Menuary (vertical food/HORECA): siti, menu digitale, prenotazioni, ordini diretti, delivery, CRM e automazioni IA.",
              "Bizery (vertical services): siti, appuntamenti, CRM, richieste clienti e automazioni per attività di servizi.",
              "Orpheo (vertical creative): presenza digitale, press kit, catalogo opere, booking, reputazione, diritti e community per artisti e progetti creativi.",
              "Other: servizi generici dello studio non appartenenti ai tre prodotti.",
              "Non chiedere mai direttamente 'Menuary, Bizery o Orpheo?'. Inferisci l'ambito chiedendo in modo naturale di cosa si occupa la persona, che servizio cerca e quale problema vuole risolvere.",
              "Gestisci qualsiasi messaggio naturale, anche vago, breve, con refusi o non previsto. Non richiedere parole chiave.",
              "Aggiorna sempre il profilo cumulativo: conserva i dati già noti e integra solo informazioni supportate dalla conversazione. Non inventare nomi, problemi o recapiti.",
              "Fai una sola domanda utile per messaggio. Non ripetere domande a cui la persona ha già risposto.",
              "Quando il vertical è abbastanza chiaro, spiega brevemente il prodotto pertinente collegandolo al problema espresso, senza inventare prezzi o funzionalità non elencate.",
              "Raccogli progressivamente nome della persona, nome attività/progetto, tipo attività, città se utile, servizi di interesse, pain point e disponibilità per una chiamata.",
              "Proponi una chiamata quando attività/progetto e almeno un bisogno o pain point sono noti. Se l'ambito è other, fai handoff allo studio senza forzare uno dei tre prodotti.",
              "Rispondi in italiano, con tono umano, consulenziale e conciso. Niente elenchi lunghi, interrogatori o linguaggio da chatbot.",
            ].join("\n"),
          }],
        },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({
              currentProfile: normalizeProfile(params.profile),
              currentVertical: params.currentVertical,
              currentVerticalConfidence: params.currentConfidence,
              currentSummary: params.summary,
              recentConversation: params.messages,
            }),
          }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "platform_whatsapp_lead_qualification",
          strict: true,
          schema: QUALIFICATION_SCHEMA,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[platform-whatsapp-lead] OpenAI analysis failed", {
      status: response.status,
      error: errorBody.slice(0, 240),
    });
    return fallbackAnalysis(
      params.profile,
      params.currentVertical,
      params.currentConfidence,
      params.summary ?? "",
    );
  }

  try {
    const text = parseOpenAIResponseText(await response.json());
    return normalizeAnalysis(JSON.parse(text)) ?? fallbackAnalysis(
      params.profile,
      params.currentVertical,
      params.currentConfidence,
      params.summary ?? "",
    );
  } catch (error) {
    console.error("[platform-whatsapp-lead] OpenAI response parse failed", error instanceof Error ? error.message : String(error));
    return fallbackAnalysis(
      params.profile,
      params.currentVertical,
      params.currentConfidence,
      params.summary ?? "",
    );
  }
}

async function findConversation(svc: any, phone: string): Promise<ConversationRow | null> {
  const { data, error } = await svc
    .from("platform_whatsapp_conversations")
    .select("id,lead_id,sender_phone_e164,state,inferred_vertical,vertical_confidence,profile,summary")
    .eq("sender_phone_e164", phone)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as ConversationRow | null;
}

async function createConversation(svc: any, phone: string): Promise<ConversationRow> {
  const { data, error } = await svc
    .from("platform_whatsapp_conversations")
    .insert({ sender_phone_e164: phone, profile: EMPTY_PROFILE })
    .select("id,lead_id,sender_phone_e164,state,inferred_vertical,vertical_confidence,profile,summary")
    .single();
  if (!error && data) return data as ConversationRow;

  const existing = await findConversation(svc, phone);
  if (existing) return existing;
  throw new Error(error?.message ?? "platform_whatsapp_conversation_create_failed");
}

async function findLead(svc: any, phone: string): Promise<LeadRow | null> {
  const { data, error } = await svc
    .from("platform_leads")
    .select("id,business_name,business_vertical,business_type,contact_name,contact_email,contact_phone,city,notes,status,stage,temperature,tenant_id,requested_services,pain_points,whatsapp_qualification")
    .eq("contact_phone_normalized", phone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as LeadRow | null;
}

async function createLead(svc: any, phone: string): Promise<LeadRow> {
  const digits = phone.replace(/\D/g, "");
  const { data, error } = await svc
    .from("platform_leads")
    .insert({
      business_name: `Contatto WhatsApp ${digits.slice(-6)}`,
      business_vertical: "food",
      contact_phone: phone,
      contact_phone_normalized: phone,
      country: "IT",
      status: "lead",
      stage: "new",
      temperature: "cold",
      source: "altro",
      notes: "Lead acquisito dal numero WhatsApp condiviso.",
    })
    .select("id,business_name,business_vertical,business_type,contact_name,contact_email,contact_phone,city,notes,status,stage,temperature,tenant_id,requested_services,pain_points,whatsapp_qualification")
    .single();
  if (error || !data) throw new Error(error?.message ?? "platform_whatsapp_lead_create_failed");
  return data as LeadRow;
}

function qualificationNotes(existing: string | null, analysis: QualificationAnalysis): string {
  const start = "[QUALIFICAZIONE WHATSAPP]";
  const end = "[/QUALIFICAZIONE WHATSAPP]";
  const current = existing ?? "";
  const blockStart = current.indexOf(start);
  const blockEnd = blockStart >= 0 ? current.indexOf(end, blockStart + start.length) : -1;
  const outside = blockStart >= 0 && blockEnd >= 0
    ? `${current.slice(0, blockStart)}${current.slice(blockEnd + end.length)}`.trim()
    : current.trim();
  const profile = analysis.profile;
  const lines = [
    start,
    `Ambito: ${brandForVertical(analysis.vertical)} (${Math.round(analysis.verticalConfidence * 100)}%)`,
    profile.businessType ? `Tipo attività/progetto: ${profile.businessType}` : null,
    profile.requestedServices.length ? `Servizi di interesse: ${profile.requestedServices.join(", ")}` : null,
    profile.painPoints.length ? `Pain point: ${profile.painPoints.join("; ")}` : null,
    profile.callPreference ? `Preferenza chiamata: ${profile.callPreference}` : null,
    analysis.summary ? `Sintesi: ${analysis.summary}` : null,
    ...profile.generalNotes.map((note) => `Nota: ${note}`),
    end,
  ].filter(Boolean).join("\n");
  return [outside, lines].filter(Boolean).join("\n\n");
}

async function updateLead(
  svc: any,
  lead: LeadRow,
  phone: string,
  analysis: QualificationAnalysis,
): Promise<void> {
  const profile = analysis.profile;
  const resolvedVertical = analysis.verticalConfidence >= 0.6 &&
    ["food", "services", "creative"].includes(analysis.vertical)
    ? analysis.vertical
    : lead.business_vertical;
  const placeholderName = /^Contatto WhatsApp\b/i.test(lead.business_name);
  const sufficientlyQualified = Boolean(
    profile.businessName &&
    (profile.requestedServices.length || profile.painPoints.length),
  );
  const update: Record<string, unknown> = {
    business_vertical: resolvedVertical,
    business_type: profile.businessType ?? lead.business_type,
    contact_name: profile.contactName ?? lead.contact_name,
    contact_email: profile.contactEmail ?? lead.contact_email,
    contact_phone: phone,
    contact_phone_normalized: phone,
    city: profile.city ?? lead.city,
    requested_services: profile.requestedServices,
    pain_points: profile.painPoints,
    whatsapp_qualification: analysis.profile,
    whatsapp_inferred_vertical: analysis.vertical,
    whatsapp_vertical_confidence: analysis.verticalConfidence,
    notes: qualificationNotes(lead.notes, analysis),
    stage: sufficientlyQualified ? "qualified" : lead.stage === "new" ? "contacted" : lead.stage,
    temperature: profile.callInterest
      ? "hot"
      : sufficientlyQualified && lead.temperature === "cold"
        ? "warm"
        : lead.temperature,
    last_whatsapp_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (placeholderName && profile.businessName) update.business_name = profile.businessName;

  const { error } = await svc.from("platform_leads").update(update).eq("id", lead.id);
  if (error) throw new Error(error.message);
}

export async function resolvePlatformWhatsappTenant(phoneInput: string): Promise<{
  tenantId: string;
  displayName: string | null;
  shouldAuthorizeOwner: boolean;
} | null> {
  const svc = db();
  const phone = normalizeWhatsappPhone(phoneInput);
  const { data: contact, error: contactError } = await svc
    .from("tenant_customer_service_contacts")
    .select("tenant_id,display_name")
    .eq("phone_e164", phone)
    .eq("enabled", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (contactError) throw new Error(contactError.message);
  if (contact?.tenant_id) {
    return {
      tenantId: contact.tenant_id,
      displayName: contact.display_name ?? null,
      shouldAuthorizeOwner: false,
    };
  }

  const { data: tenantLeads, error: tenantLeadError } = await svc
    .from("platform_leads")
    .select("tenant_id,contact_name,status,stage")
    .eq("contact_phone_normalized", phone)
    .not("tenant_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (tenantLeadError) throw new Error(tenantLeadError.message);
  const lead = (tenantLeads ?? []).find((row: {
    tenant_id: string | null;
    contact_name: string | null;
    status: string;
    stage: string;
  }) => row.tenant_id && (row.status === "active" || row.stage === "tenant"));
  if (!lead?.tenant_id) return null;
  return {
    tenantId: lead.tenant_id,
    displayName: lead.contact_name,
    shouldAuthorizeOwner: true,
  };
}

export async function handlePlatformWhatsappLeadMessage(
  input: PlatformWhatsappLeadInput,
): Promise<{ replies: string[]; leadId?: string; conversationId?: string }> {
  const svc = db();
  const phone = normalizeWhatsappPhone(input.from);
  if (!phone || !input.text.trim()) {
    return { replies: ["Scrivimi pure di cosa ti occupi e cosa vorresti migliorare: ti indirizzo verso il servizio più adatto."] };
  }

  if (input.messageId) {
    const { data: duplicate, error } = await svc
      .from("platform_whatsapp_messages")
      .select("conversation_id")
      .eq("provider_message_id", input.messageId)
      .eq("direction", "inbound")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (duplicate) {
      const { data: priorReplies } = await svc
        .from("platform_whatsapp_messages")
        .select("body")
        .eq("reply_to_provider_message_id", input.messageId)
        .eq("direction", "outbound")
        .order("created_at", { ascending: true });
      return {
        conversationId: duplicate.conversation_id,
        replies: (priorReplies ?? []).map((row: { body: string }) => row.body),
      };
    }
  }

  let conversation = await findConversation(svc, phone);
  if (!conversation) conversation = await createConversation(svc, phone);
  let lead = await findLead(svc, phone);
  if (!lead) lead = await createLead(svc, phone);
  const currentProfile = profileWithLeadData(conversation.profile, lead);

  if (conversation.lead_id !== lead.id) {
    const { error } = await svc
      .from("platform_whatsapp_conversations")
      .update({ lead_id: lead.id, updated_at: new Date().toISOString() })
      .eq("id", conversation.id);
    if (error) throw new Error(error.message);
    conversation = { ...conversation, lead_id: lead.id };
  }

  const { error: inboundError } = await svc.from("platform_whatsapp_messages").insert({
    conversation_id: conversation.id,
    direction: "inbound",
    provider_message_id: input.messageId ?? null,
    body: input.text.trim(),
    payload: input.payload ?? {},
  });
  if (inboundError) throw new Error(inboundError.message);

  const { data: recentRows, error: recentError } = await svc
    .from("platform_whatsapp_messages")
    .select("direction,body")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: false })
    .limit(14);
  if (recentError) throw new Error(recentError.message);
  const recent = (recentRows ?? []).reverse() as Array<{ direction: "inbound" | "outbound"; body: string }>;

  const rawAnalysis = await analyzeWithAi({
    profile: currentProfile,
    currentVertical: conversation.inferred_vertical,
    currentConfidence: conversation.vertical_confidence,
    summary: conversation.summary,
    messages: recent,
  });
  const keepKnownVertical = rawAnalysis.vertical === "unknown" &&
    conversation.inferred_vertical !== "unknown";
  const analysis: QualificationAnalysis = {
    ...rawAnalysis,
    vertical: keepKnownVertical ? conversation.inferred_vertical : rawAnalysis.vertical,
    verticalConfidence: keepKnownVertical
      ? conversation.vertical_confidence
      : rawAnalysis.verticalConfidence,
    profile: mergeProfiles(currentProfile, rawAnalysis.profile),
    summary: rawAnalysis.summary || conversation.summary || "",
  };

  await updateLead(svc, lead, phone, analysis);

  const now = new Date().toISOString();
  const { error: conversationError } = await svc
    .from("platform_whatsapp_conversations")
    .update({
      state: analysis.conversationState,
      inferred_vertical: analysis.vertical,
      vertical_confidence: analysis.verticalConfidence,
      profile: analysis.profile,
      summary: analysis.summary,
      last_message_at: now,
      updated_at: now,
    })
    .eq("id", conversation.id);
  if (conversationError) throw new Error(conversationError.message);

  const { error: outboundError } = await svc.from("platform_whatsapp_messages").insert({
    conversation_id: conversation.id,
    direction: "outbound",
    reply_to_provider_message_id: input.messageId ?? null,
    body: analysis.reply,
    payload: {
      vertical: analysis.vertical,
      verticalConfidence: analysis.verticalConfidence,
      state: analysis.conversationState,
    },
  });
  if (outboundError) throw new Error(outboundError.message);

  return {
    replies: [analysis.reply],
    leadId: lead.id,
    conversationId: conversation.id,
  };
}
