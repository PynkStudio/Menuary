import { messages as en } from "./en";
import { mergeMessages } from "./_merge";

export const messages = mergeMessages(en, {
  marketing: {
    shell: {
      nav: { offer: "Προσφορά", about: "Studio", myAccount: "Ο λογαριασμός μου", signIn: "Σύνδεση", contact: "Ας μιλήσουμε" },
      footer: { nav: "Πλοήγηση", contacts: "Επικοινωνία", forRestaurants: "Για εστιατόρια", requestProposal: "Ζητήστε πρόταση", privacy: "Απόρρητο", cookie: "Cookies" },
    },
    home: {
      heroLabel: "Για εστιατόρια, μπαρ και ταβέρνες",
      heroH1a: "Το κατάστημά σας online,",
      heroH1b: "χωρίς ταλαιπωρία.",
      heroSub: "Επαγγελματική ιστοσελίδα, online κρατήσεις και απλή διαχείριση της παρουσίας σας στο Google Maps.",
      ctaDemo: "Ζητήστε demo", ctaExample: "Δείτε παράδειγμα",
      badgeFreeCall: "Πρώτη κλήση δωρεάν", badgeOnline: "Online σε 2-4 εβδομάδες", badgeMultilang: "Πολύγλωσσο · IT EN FR DE ES +",
    },
    contact: {
      label: "Επικοινωνία", h1a: "Πείτε μας για το εστιατόριό σας.", h1b: "Απαντάμε με μια συγκεκριμένη ιδέα.",
      emailLabel: "Γράψτε μας", phoneLabel: "Καλέστε ή στείλτε WhatsApp", responseTime: "Απάντηση εντός 24 ωρών σε εργάσιμες ημέρες.",
      locationNote: "Συνεργαζόμαστε με εστιατόρια σε όλη την Ευρώπη.",
    },
    leadForm: {
      name: "Όνομα", restaurant: "Εστιατόριο", email: "Email", phone: "Τηλέφωνο", city: "Πόλη", country: "Χώρα",
      interest: "Ενδιαφέρον", message: "Στόχος", submit: "Αποστολή αιτήματος", success: "Το αίτημα στάλθηκε",
      errorConnection: "Η σύνδεση δεν είναι διαθέσιμη.", errorDefault: "Η αποστολή απέτυχε.",
    },
  },
  bizery: {
    shell: { nav: { offer: "Προσφορά", about: "Studio", access: "Σύνδεση", contact: "Ας μιλήσουμε" } },
    home: {
      heroLabel: "Για γραφεία και επιχειρήσεις υπηρεσιών",
      heroH1a: "Η επιχείρησή σας online,", heroH1b: "χωρίς ταλαιπωρία.",
      ctaDemo: "Ζητήστε demo", ctaHow: "Πώς λειτουργεί",
    },
  },
} as const);
