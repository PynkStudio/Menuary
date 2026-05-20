"""
generate_designer_guide.py
Genera designer-figma-guide.pdf — Guida Figma → Menuary / Bizery
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame,
    Paragraph, Spacer, Table, TableStyle, HRFlowable,
    KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfbase import pdfmetrics

import os

# ── Palette ──────────────────────────────────────────────────────────────────
INK        = colors.HexColor("#0f172a")
RED        = colors.HexColor("#e63946")
LIGHT_GRAY = colors.HexColor("#f8fafc")
MID_GRAY   = colors.HexColor("#94a3b8")
RULE_GRAY  = colors.HexColor("#e2e8f0")
NOTE_BG    = colors.HexColor("#f1f5f9")
TABLE_ALT  = colors.HexColor("#f8fafc")
WHITE      = colors.white

# ── Dimensions ───────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN_H = 2 * cm
MARGIN_V = 2 * cm
CONTENT_W = PAGE_W - 2 * MARGIN_H

OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "designer-figma-guide.pdf"
)

# ── Custom Flowables ─────────────────────────────────────────────────────────

class ColoredHRule(Flowable):
    """Thin horizontal rule in a given color."""
    def __init__(self, width, color, thickness=0.8):
        super().__init__()
        self.width = width
        self.color = color
        self.thickness = thickness
        self.height = thickness + 2

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, self.thickness / 2, self.width, self.thickness / 2)


class NoteBox(Flowable):
    """Light-gray box with a red left border and italic text."""
    def __init__(self, text, width, style):
        super().__init__()
        self._text = text
        self._width = width
        self._style = style
        self._padding_left = 14
        self._padding_v = 9
        self._border = 3

    def wrap(self, availW, availH):
        inner_w = self._width - self._padding_left - 12
        p = Paragraph(self._text, self._style)
        _, h = p.wrap(inner_w, availH)
        self._para_h = h
        self.height = h + 2 * self._padding_v
        self.width = self._width
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        # background
        c.setFillColor(NOTE_BG)
        c.setStrokeColor(NOTE_BG)
        c.roundRect(0, 0, w, h, 4, fill=1, stroke=0)
        # left border
        c.setFillColor(RED)
        c.rect(0, 0, self._border, h, fill=1, stroke=0)
        # text
        inner_w = w - self._padding_left - 10
        p = Paragraph(self._text, self._style)
        p.wrap(inner_w, h)
        p.drawOn(c, self._padding_left, self._padding_v)


class ChecklistBox(Flowable):
    """Styled checklist box with light background."""
    def __init__(self, title, items, width, title_style, item_style):
        super().__init__()
        self._title = title
        self._items = items
        self._width = width
        self._title_style = title_style
        self._item_style = item_style
        self._pad_h = 16
        self._pad_v = 12
        self._gap = 6

    def wrap(self, availW, availH):
        inner_w = self._width - 2 * self._pad_h
        tp = Paragraph(self._title, self._title_style)
        _, th = tp.wrap(inner_w, availH)
        total = th + self._gap
        self._item_heights = []
        for item in self._items:
            p = Paragraph(item, self._item_style)
            _, ih = p.wrap(inner_w - 18, availH)
            self._item_heights.append(ih)
            total += ih + 4
        self._title_h = th
        self.height = total + 2 * self._pad_v + 6
        self.width = self._width
        return self.width, self.height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        c.setFillColor(NOTE_BG)
        c.setStrokeColor(RULE_GRAY)
        c.setLineWidth(0.5)
        c.roundRect(0, 0, w, h, 6, fill=1, stroke=1)

        inner_w = w - 2 * self._pad_h
        y = h - self._pad_v

        # Title
        tp = Paragraph(self._title, self._title_style)
        tw, th = tp.wrap(inner_w, h)
        y -= th
        tp.drawOn(c, self._pad_h, y)
        y -= self._gap + 4

        # Items
        for i, (item, ih) in enumerate(zip(self._items, self._item_heights)):
            y -= ih
            p = Paragraph(item, self._item_style)
            p.wrap(inner_w - 18, h)
            p.drawOn(c, self._pad_h + 18, y)
            # draw checkbox symbol
            c.setFont("Helvetica", 10)
            c.setFillColor(MID_GRAY)
            c.drawString(self._pad_h + 1, y + 1, "☐")
            y -= 4


# ── Page template with footer ─────────────────────────────────────────────────

def make_page_template(doc):
    frame = Frame(
        MARGIN_H, MARGIN_V + 18,
        CONTENT_W, PAGE_H - 2 * MARGIN_V - 18,
        leftPadding=0, rightPadding=0,
        topPadding=0, bottomPadding=0,
        id="main"
    )

    def on_page(canvas, document):
        canvas.saveState()
        # footer rule
        canvas.setStrokeColor(RULE_GRAY)
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN_H, MARGIN_V + 12, PAGE_W - MARGIN_H, MARGIN_V + 12)
        # footer left
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MID_GRAY)
        canvas.drawString(MARGIN_H, MARGIN_V + 3, "Menuary · Bizery — Guida Figma → Export")
        # footer right — page number (skip cover page)
        if document.page > 1:
            pn = str(document.page)
            canvas.drawRightString(PAGE_W - MARGIN_H, MARGIN_V + 3, pn)
        canvas.restoreState()

    return PageTemplate(id="main", frames=[frame], onPage=on_page)


# ── Styles ────────────────────────────────────────────────────────────────────

def build_styles():
    s = {}

    s["platform_label"] = ParagraphStyle(
        "platform_label",
        fontName="Helvetica",
        fontSize=9,
        textColor=MID_GRAY,
        spaceAfter=6,
        letterSpacing=2,
    )
    s["cover_title"] = ParagraphStyle(
        "cover_title",
        fontName="Helvetica-Bold",
        fontSize=28,
        textColor=INK,
        leading=34,
        spaceAfter=10,
    )
    s["cover_subtitle"] = ParagraphStyle(
        "cover_subtitle",
        fontName="Helvetica",
        fontSize=12,
        textColor=MID_GRAY,
        leading=18,
        spaceAfter=8,
    )
    s["cover_date"] = ParagraphStyle(
        "cover_date",
        fontName="Helvetica",
        fontSize=9,
        textColor=MID_GRAY,
        spaceAfter=0,
    )
    s["section_heading"] = ParagraphStyle(
        "section_heading",
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=INK,
        spaceBefore=20,
        spaceAfter=6,
        leading=18,
    )
    s["body"] = ParagraphStyle(
        "body",
        fontName="Helvetica",
        fontSize=9.5,
        textColor=INK,
        leading=15,
        spaceAfter=8,
    )
    s["note"] = ParagraphStyle(
        "note",
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        textColor=INK,
        leading=13,
    )
    s["checklist_title"] = ParagraphStyle(
        "checklist_title",
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=INK,
        leading=14,
    )
    s["checklist_item"] = ParagraphStyle(
        "checklist_item",
        fontName="Helvetica",
        fontSize=9,
        textColor=INK,
        leading=13,
    )
    s["mono"] = ParagraphStyle(
        "mono",
        fontName="Courier",
        fontSize=8.5,
        textColor=INK,
        leading=13,
    )
    s["mono_small"] = ParagraphStyle(
        "mono_small",
        fontName="Courier",
        fontSize=8,
        textColor=INK,
        leading=12,
    )
    s["table_header"] = ParagraphStyle(
        "table_header",
        fontName="Helvetica-Bold",
        fontSize=8.5,
        textColor=WHITE,
        leading=12,
    )
    s["table_cell"] = ParagraphStyle(
        "table_cell",
        fontName="Helvetica",
        fontSize=8.5,
        textColor=INK,
        leading=12,
    )
    s["table_mono"] = ParagraphStyle(
        "table_mono",
        fontName="Courier",
        fontSize=8,
        textColor=INK,
        leading=12,
    )

    return s


# ── Table helper ──────────────────────────────────────────────────────────────

def make_table(headers, rows, col_widths, styles_dict, first_col_mono=True):
    """Build a styled table with alternating rows."""
    th = styles_dict["table_header"]
    tc = styles_dict["table_cell"]
    tm = styles_dict["table_mono"]

    data = [[Paragraph(h, th) for h in headers]]
    for row in rows:
        cells = []
        for i, cell in enumerate(row):
            st = tm if (i == 0 and first_col_mono) else tc
            cells.append(Paragraph(cell, st))
        data.append(cells)

    n = len(rows)
    row_bg = []
    for i in range(1, n + 1):
        bg = WHITE if i % 2 == 1 else TABLE_ALT
        row_bg.append(("BACKGROUND", (0, i), (-1, i), bg))

    t = Table(data, colWidths=col_widths, repeatRows=1)
    ts = TableStyle([
        # header
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 7),
        ("TOPPADDING", (0, 0), (-1, 0), 7),
        # body
        ("FONTSIZE", (0, 1), (-1, -1), 8.5),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, TABLE_ALT]),
        # grid
        ("BOX", (0, 0), (-1, -1), 0.5, RULE_GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, RULE_GRAY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ] + row_bg)
    t.setStyle(ts)
    return t


def section_rule(width):
    return ColoredHRule(width, RULE_GRAY, thickness=0.6)


# ── Content builder ───────────────────────────────────────────────────────────

def build_story(s):
    story = []
    W = CONTENT_W

    # ── Cover ──────────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.2 * cm))
    story.append(Paragraph("MENUARY · BIZERY", s["platform_label"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Guida Figma → Menuary / Bizery", s["cover_title"]))
    story.append(Paragraph(
        "Come strutturare il design in Figma e Anima per un import plug&nbsp;&amp;&nbsp;play",
        s["cover_subtitle"]
    ))
    story.append(ColoredHRule(W, RED, thickness=1.5))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Maggio 2026", s["cover_date"]))
    story.append(Spacer(1, 28))

    # ── Section 1 — Export da Anima ────────────────────────────────────────
    story.append(section_rule(W))
    story.append(Spacer(1, 4))
    story.append(Paragraph("1 — Export da Anima", s["section_heading"]))
    story.append(Paragraph(
        "Una volta completato il design in Figma, usa il plugin Anima per esportare l'intera pagina "
        "come HTML statico. L'output viene poi inviato al dev o caricato direttamente nel CRM per la "
        "generazione della demo del tenant. Segui queste impostazioni esatte:",
        s["body"]
    ))

    note1_text = (
        "<b>Plugin:</b> Anima → Export → <b>HTML</b> (non React, non Vue)<br/>"
        "<b>Spuntare:</b> Include assets &nbsp;·&nbsp; Flatten CSS &nbsp;·&nbsp; Export as ZIP<br/>"
        "<b>NON usare</b> \"Responsive\" di Anima — la responsività la gestiamo noi dopo"
    )
    story.append(NoteBox(note1_text, W, s["note"]))
    story.append(Spacer(1, 14))

    # ── Section 2 — Colori ──────────────────────────────────────────────────
    story.append(section_rule(W))
    story.append(Spacer(1, 4))
    story.append(Paragraph("2 — Colori: usa i CSS token del tenant", s["section_heading"]))
    story.append(Paragraph(
        "Non usare colori hardcoded. Crea in Figma degli stili colore con questi nomi esatti — "
        "Anima li esporterà come variabili CSS che si agganciano automaticamente al tema del tenant.",
        s["body"]
    ))

    color_headers = ["Nome stile Figma", "Variabile CSS generata", "Ruolo"]
    color_rows = [
        ["tenant/red",          "--tenant-red",          "Primario / CTA"],
        ["tenant/red-dark",     "--tenant-red-dark",     "Hover primario"],
        ["tenant/peach",        "--tenant-peach",        "Accento soft"],
        ["tenant/cream",        "--tenant-cream",        "Sfondo chiaro"],
        ["tenant/ink",          "--tenant-ink",          "Testo principale"],
        ["tenant/brick",        "--tenant-brick",        "Testo secondario"],
        ["tenant/mustard",      "--tenant-mustard",      "Accento caldo"],
        ["tenant/mustard-soft", "--tenant-mustard-soft", "Accento caldo soft"],
        ["tenant/green",        "--tenant-green",        "Successo / disponibile"],
        ["tenant/pink",         "--tenant-pink",         "Badge / promozioni"],
    ]
    cw2 = [W * 0.28, W * 0.36, W * 0.36]
    story.append(make_table(color_headers, color_rows, cw2, s))
    story.append(Spacer(1, 10))
    story.append(NoteBox(
        "Il colore esatto di ogni token viene impostato dal sales quando crea la demo. "
        "Il designer lavora con i nomi, non con i valori esatti.",
        W, s["note"]
    ))
    story.append(Spacer(1, 14))

    # ── Section 3 — Sezioni / slot ─────────────────────────────────────────
    story.append(section_rule(W))
    story.append(Spacer(1, 4))
    story.append(Paragraph("3 — Sezioni: nomina i frame con gli slot", s["section_heading"]))
    story.append(Paragraph(
        "Le sezioni che verranno sostituite da moduli reali devono avere un nome frame preciso in Figma. "
        "Anima esporterà il nome come <font name=\"Courier\">id</font> HTML, e il dev potrà agganciarci "
        "il modulo senza cercare nel markup.",
        s["body"]
    ))

    slot_headers = ["Nome frame in Figma", "Modulo reale collegato"]
    slot_rows = [
        ["slot-hero",     "Hero / Copertina del tenant"],
        ["slot-menu",     "Menu / Listino prezzi (da database)"],
        ["slot-booking",  "Prenotazioni / Appuntamenti"],
        ["slot-gallery",  "Galleria foto"],
        ["slot-reviews",  "Recensioni"],
        ["slot-contact",  "Mappa + contatti"],
        ["slot-delivery", "Delivery partner (Glovo, Deliveroo…)"],
        ["slot-shop",     "Shop / Carrello"],
    ]
    cw3 = [W * 0.38, W * 0.62]
    story.append(make_table(slot_headers, slot_rows, cw3, s))
    story.append(Spacer(1, 10))
    story.append(NoteBox(
        "Le sezioni non in questa lista (header decorativi, separatori, aree grafiche) "
        "le nomina liberamente — resteranno HTML statico nel sito.",
        W, s["note"]
    ))
    story.append(Spacer(1, 14))

    # ── Section 4 — Layer testo ─────────────────────────────────────────────
    story.append(section_rule(W))
    story.append(Spacer(1, 4))
    story.append(Paragraph("4 — Contenuti: nomi dei layer testo", s["section_heading"]))
    story.append(Paragraph(
        "Nomina i layer testo in Figma con questi nomi. Non è obbligatorio, ma accelera il lavoro "
        "del dev nell'aggancio dei contenuti reali del tenant.",
        s["body"]
    ))

    layer_headers = ["Nome layer", "Contenuto atteso"]
    layer_rows = [
        ["hero-eyebrow",       'Etichetta sopra il titolo (es. "Ristorante pugliese dal 1987")'],
        ["hero-title-lead",    "Parte principale del titolo grande"],
        ["hero-title-accent",  "Parola/frase in evidenza nel titolo"],
        ["hero-body",          "Sottotitolo / descrizione hero"],
        ["hero-cta",           "Label del bottone principale CTA"],
        ["contact-phone",      "Numero di telefono"],
        ["contact-address",    "Indirizzo completo"],
        ["contact-city",       "Città"],
        ["footer-tagline",     "Frase breve in footer"],
        ["footer-body",        "Testo descrittivo footer"],
    ]
    cw4 = [W * 0.35, W * 0.65]
    story.append(make_table(layer_headers, layer_rows, cw4, s))
    story.append(Spacer(1, 10))
    story.append(NoteBox(
        "Usa testi verosimili nel design (non \"Lorem ipsum\") — "
        "il cliente vede qualcosa di sensato già dalla prima demo.",
        W, s["note"]
    ))
    story.append(Spacer(1, 14))

    # ── Section 5 — Asset ───────────────────────────────────────────────────
    story.append(section_rule(W))
    story.append(Spacer(1, 4))
    story.append(Paragraph("5 — Asset: nomi file fissi", s["section_heading"]))

    asset_headers = ["File", "Cosa è"]
    asset_rows = [
        ["logo.svg",       "Logo principale (SVG, sfondo trasparente)"],
        ["logo-white.svg", "Versione bianca del logo (per sfondi scuri)"],
        ["hero.jpg",       "Immagine backdrop hero (≥ 1920×1080 px)"],
        ["og.jpg",         "Immagine Open Graph per social (1200×630 px)"],
        ["favicon.svg",    "Favicon (opzionale, se diversa dal logo)"],
    ]
    cw5 = [W * 0.30, W * 0.70]
    story.append(make_table(asset_headers, asset_rows, cw5, s))
    story.append(Spacer(1, 10))
    story.append(NoteBox(
        "Gli altri asset (foto piatti, icone, sfondi sezioni) possono avere nomi liberi.",
        W, s["note"]
    ))
    story.append(Spacer(1, 14))

    # ── Section 6 — Breakpoint ──────────────────────────────────────────────
    story.append(section_rule(W))
    story.append(Spacer(1, 4))
    story.append(Paragraph("6 — Breakpoint di riferimento", s["section_heading"]))
    story.append(Paragraph(
        "Il sistema è mobile-first. Progetta principalmente a 390 px (mobile) e 1280 px (desktop). "
        "Non è necessario progettare breakpoints intermedi.",
        s["body"]
    ))

    bp_headers = ["Viewport", "Uso"]
    bp_rows = [
        ["390 px",  "Mobile — riferimento primario"],
        ["768 px",  "Tablet — opzionale"],
        ["1280 px", "Desktop — riferimento secondario"],
        ["1920 px", "Wide — solo hero/backdrop"],
    ]
    cw6 = [W * 0.25, W * 0.75]
    story.append(make_table(bp_headers, bp_rows, cw6, s, first_col_mono=False))
    story.append(Spacer(1, 14))

    # ── Section 7 — Checklist ───────────────────────────────────────────────
    story.append(section_rule(W))
    story.append(Spacer(1, 4))
    story.append(Paragraph("7 — Checklist prima dell'export", s["section_heading"]))

    checklist_items = [
        "Stili colore creati con nomi <font name=\"Courier\">tenant/*</font> in Figma",
        "Frame delle sezioni modulo nominati <font name=\"Courier\">slot-*</font>",
        "Layer testo nominati con i campi del sistema (almeno hero e contact)",
        "Asset fissi nella root (<font name=\"Courier\">logo.svg</font>, <font name=\"Courier\">hero.jpg</font>)",
        "Export da Anima: HTML, Include assets, Export as ZIP",
        "ZIP inviato al dev o caricato nella modale \"Crea demo\" del CRM",
    ]
    story.append(ChecklistBox(
        "Prima di inviare lo ZIP, verifica:",
        checklist_items,
        W,
        s["checklist_title"],
        s["checklist_item"]
    ))
    story.append(Spacer(1, 10))

    return story


# ── Main ──────────────────────────────────────────────────────────────────────

def generate():
    doc = BaseDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=MARGIN_H,
        rightMargin=MARGIN_H,
        topMargin=MARGIN_V,
        bottomMargin=MARGIN_V + 18,
    )
    doc.addPageTemplates([make_page_template(doc)])

    s = build_styles()
    story = build_story(s)

    doc.build(story)
    print(f"PDF generato: {OUTPUT_PATH}")


if __name__ == "__main__":
    generate()
