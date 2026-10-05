export async function register() {
  // Le server action di @pynkstudio/mailapp possono girare su un'istanza fredda
  // prima che la pagina che importa il runtime sia stata valutata: senza questa
  // registrazione all'avvio falliscono con "runtime is not configured".
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/mailapp-runtime");
  }
}
