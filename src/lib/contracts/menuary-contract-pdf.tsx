import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  FORNITORE,
  computeYearlyTotal,
  formatEUR,
  paymentMethodLabel,
  type ContractData,
} from "./menuary-contract";
import { buildClauses, VESSATORIE_RIF } from "./menuary-clauses";
import { buildAttachments } from "./menuary-attachments";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
    lineHeight: 1.5,
  },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 16 },
  partiesRow: { flexDirection: "row", marginVertical: 12, gap: 16 },
  partyBox: { flex: 1, padding: 10, border: "1px solid #e5e7eb", borderRadius: 4 },
  partyLabel: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  partyName: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 2 },
  summary: {
    border: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  summaryRow: { flexDirection: "row", marginBottom: 4 },
  summaryDt: { width: 150, color: "#6b7280" },
  summaryDd: { flex: 1, fontFamily: "Helvetica-Bold" },
  clause: { marginBottom: 12 },
  clauseTitle: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 4 },
  clauseBody: { textAlign: "justify" },
  vessatorie: {
    marginTop: 18,
    padding: 10,
    border: "1px solid #d1d5db",
    backgroundColor: "#fffbeb",
    borderRadius: 4,
    fontSize: 9.5,
  },
  vessatorieTitle: { fontFamily: "Helvetica-Bold", marginBottom: 4 },
  signaturesRow: { flexDirection: "row", marginTop: 36, gap: 32 },
  sigBox: { flex: 1 },
  sigLabel: { fontSize: 9.5, marginBottom: 50 },
  sigLine: { borderTop: "1px solid #111827", paddingTop: 4, fontSize: 9 },
  attachmentCode: {
    fontSize: 8,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontFamily: "Helvetica-Bold",
  },
  attachmentTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  attachmentSubtitle: { fontSize: 9.5, color: "#6b7280", marginBottom: 14 },
  attSection: { marginBottom: 10 },
  attHeading: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 3 },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#9ca3af",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

type Props = {
  data: ContractData;
  overrides: Record<string, string>;
};

function PageFooter({ data }: { data: ContractData }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        Contratto n. {data.numero} — {FORNITORE.ragioneSociale}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

export function MenuaryContractPdf({ data, overrides }: Props) {
  const clauses = buildClauses(data);
  const attachments = buildAttachments(data);
  const annuale = data.economiche.cicloFatturazione === "yearly";
  const totaleAnnuale = computeYearlyTotal(
    data.economiche.canoneMensile,
    data.economiche.scontoAnnuale,
  );

  return (
    <Document
      title={`Contratto Menuary ${data.numero}`}
      author={FORNITORE.ragioneSociale}
      subject="Contratto di fornitura del servizio Menuary"
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.h1}>Contratto di fornitura del servizio Menuary</Text>
        <Text style={styles.subtitle}>
          Contratto n. {data.numero} — Milano, {data.dataStipula}
        </Text>

        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Fornitore</Text>
            <Text style={styles.partyName}>{FORNITORE.ragioneSociale}</Text>
            <Text>P.IVA {FORNITORE.piva}</Text>
            <Text>{FORNITORE.indirizzo}</Text>
            <Text>PEC: {FORNITORE.pec}</Text>
            <Text>Legale rappr.: {FORNITORE.legaleRappresentante}</Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Cliente</Text>
            <Text style={styles.partyName}>
              {data.cliente.ragioneSociale || "—"}
            </Text>
            <Text>
              P.IVA {data.cliente.piva || "—"}
              {data.cliente.cf ? ` · C.F. ${data.cliente.cf}` : ""}
            </Text>
            <Text>{data.cliente.sedeLegale || "—"}</Text>
            <Text>PEC: {data.cliente.pec || "—"}</Text>
            <Text>Legale rappr.: {data.cliente.legaleRappresentante || "—"}</Text>
          </View>
        </View>

        <View style={styles.summary}>
          <SummaryItem dt="Piano sottoscritto" dd={data.servizio.pianoNome} />
          <SummaryItem
            dt="Tenant / dominio"
            dd={`${data.servizio.tenantSlug || "—"}${data.servizio.dominio ? ` · ${data.servizio.dominio}` : ""}`}
          />
          <SummaryItem
            dt="Setup una tantum"
            dd={`${formatEUR(data.economiche.setup)} + IVA`}
          />
          <SummaryItem
            dt="Canone"
            dd={
              annuale
                ? `${formatEUR(totaleAnnuale)} + IVA / anno (sconto ${data.economiche.scontoAnnuale}% — equivalente a ${formatEUR(totaleAnnuale / 12)}/mese)`
                : `${formatEUR(data.economiche.canoneMensile)} + IVA / mese`
            }
          />
          <SummaryItem
            dt="Modalità di pagamento"
            dd={paymentMethodLabel(data.economiche.metodoPagamento)}
          />
          <SummaryItem
            dt="Durata"
            dd="12 mesi con rinnovo tacito · preavviso di recesso 30 giorni"
          />
        </View>

        {clauses.map((c) => (
          <View key={c.id} style={styles.clause} wrap={false}>
            <Text style={styles.clauseTitle}>{c.title}</Text>
            <Text style={styles.clauseBody}>{overrides[c.id] ?? c.body}</Text>
          </View>
        ))}

        <View style={styles.vessatorie} wrap={false}>
          <Text style={styles.vessatorieTitle}>
            Approvazione specifica delle clausole vessatorie (artt. 1341 e 1342 c.c.).
          </Text>
          <Text>
            Il Cliente, previa attenta lettura, dichiara di approvare specificamente per
            iscritto le clausole di cui agli artt.: {VESSATORIE_RIF.join("; ")}.
          </Text>
        </View>

        <View style={styles.signaturesRow} wrap={false}>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>Per il Fornitore — {FORNITORE.ragioneSociale}</Text>
            <Text style={styles.sigLine}>Timbro e firma</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigLabel}>
              Per il Cliente — {data.cliente.ragioneSociale || "—"}
            </Text>
            <Text style={styles.sigLine}>Timbro e firma</Text>
          </View>
        </View>

        <View style={styles.signaturesRow} wrap={false}>
          <View style={styles.sigBox}>
            <Text style={styles.sigLine}>
              Firma per accettazione specifica delle clausole vessatorie (Fornitore)
            </Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={styles.sigLine}>
              Firma per accettazione specifica delle clausole vessatorie (Cliente)
            </Text>
          </View>
        </View>

        <PageFooter data={data} />
      </Page>

      {attachments.map((a) => (
        <Page key={a.id} size="A4" style={styles.page} wrap>
          <Text style={styles.attachmentCode}>Allegato {a.code}</Text>
          <Text style={styles.attachmentTitle}>{a.title}</Text>
          <Text style={styles.attachmentSubtitle}>{a.subtitle}</Text>

          {a.sections.map((s, i) => (
            <View key={i} style={styles.attSection} wrap={false}>
              <Text style={styles.attHeading}>{s.heading}</Text>
              <Text style={styles.clauseBody}>{s.body}</Text>
            </View>
          ))}

          <View style={styles.signaturesRow} wrap={false}>
            <View style={styles.sigBox}>
              <Text style={styles.sigLine}>Fornitore</Text>
            </View>
            <View style={styles.sigBox}>
              <Text style={styles.sigLine}>Cliente</Text>
            </View>
          </View>

          <PageFooter data={data} />
        </Page>
      ))}
    </Document>
  );
}

function SummaryItem({ dt, dd }: { dt: string; dd: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryDt}>{dt}</Text>
      <Text style={styles.summaryDd}>{dd}</Text>
    </View>
  );
}
