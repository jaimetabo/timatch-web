// Holt die Wochenwerte von timatch.de und app.timatch.de aus unserem Matomo und schreibt sie als
// JSON (zahlen.json) und als kurze Markdown-Übersicht (zahlen.md). Läuft sonntags in der Action
// `zahlen.yml`; die Claude-Routine „Timatch: Zahlen der Woche" liest das Ergebnis aus dem Issue mit
// dem Label `zahlen-daten` und schreibt daraus den Bericht.
//
// Zeitraum: die 7 Tage bis einschließlich gestern (Berliner Zeit) — sonntags also So–Sa —, dazu
// dieselben 7 Tage eine Woche davor zum Vergleich und die Besuche je Tag der letzten 28 Tage.
// Ohne Abhängigkeiten (Node 20+: fetch).

import { writeFileSync } from "node:fs";

const TOKEN = process.env.MATOMO_TOKEN;
const API = process.env.MATOMO_API || "https://jaimetaboada.com/matomo/index.php";
const SITES = (process.env.MATOMO_SITES || "2:timatch.de,3:app.timatch.de")
  .split(",").map((s) => { const [id, name] = s.split(":"); return { id: Number(id), name }; });

if (!TOKEN) { console.error("MATOMO_TOKEN fehlt (GitHub-Secret)."); process.exit(1); }

// ------------------------------------------------------------ Datum in Berliner Zeit
const berlinHeute = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date()); // YYYY-MM-DD
const tag = (iso, delta) => { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + delta); return d.toISOString().slice(0, 10); };
const diese = { von: tag(berlinHeute, -7), bis: tag(berlinHeute, -1) };
const vorher = { von: tag(berlinHeute, -14), bis: tag(berlinHeute, -8) };
const kurz = (iso) => { const [, m, d] = iso.split("-"); return `${d}.${m}.`; };

// ------------------------------------------------------------ Matomo
async function bulk(anfragen) {
  const body = new URLSearchParams({ module: "API", method: "API.getBulkRequest", format: "json", token_auth: TOKEN });
  anfragen.forEach((q, i) => body.append(`urls[${i}]`, new URLSearchParams(q).toString()));
  for (let versuch = 1; ; versuch++) {
    try {
      const res = await fetch(API, { method: "POST", body, signal: AbortSignal.timeout(120_000) });
      const text = await res.text();
      if (res.status === 401 || res.status === 403) {
        console.error("Matomo lehnt das Token ab (HTTP " + res.status + "). Ist MATOMO_TOKEN aktuell?");
        process.exit(1);
      }
      let json;
      try { json = JSON.parse(text); } catch { throw new Error(`Keine JSON-Antwort (HTTP ${res.status}): ${text.slice(0, 200)}`); }
      if (json && json.result === "error") throw new Error(`Matomo: ${json.message}`);
      json.forEach((r, i) => { if (r && r.result === "error") throw new Error(`Matomo (${anfragen[i].method}): ${r.message}`); });
      return json;
    } catch (e) {
      if (versuch >= 3) throw e;
      console.error(`Versuch ${versuch} fehlgeschlagen: ${e.message} — neuer Versuch in 20 s`);
      await new Promise((r) => setTimeout(r, 20_000));
    }
  }
}

const zeilen = (tabelle, felder = ["nb_visits"], max = 10) =>
  (Array.isArray(tabelle) ? tabelle : []).slice(0, max).map((r) => {
    const z = { label: r.label };
    felder.forEach((f) => { if (r[f] !== undefined) z[f] = r[f]; });
    return z;
  });

async function zeitraum(idSite, { von, bis }) {
  const basis = { idSite, period: "range", date: `${von},${bis}`, format: "json" };
  const q = (method, extra = {}) => ({ ...basis, method, ...extra });
  const [summe, aktionen, seiten, ausgang, kanaele, websites, suche, kampagnen, laender, geraete, systeme, ereignisse] = await bulk([
    q("VisitsSummary.get"),
    q("Actions.get"),
    q("Actions.getPageUrls", { flat: 1, filter_limit: 12, filter_sort_column: "nb_hits" }),
    q("Actions.getOutlinks", { flat: 1, filter_limit: 10 }),
    q("Referrers.getReferrerType"),
    q("Referrers.getWebsites", { filter_limit: 8 }),
    q("Referrers.getSearchEngines", { filter_limit: 5 }),
    q("Referrers.getCampaigns", { filter_limit: 5 }),
    q("UserCountry.getCountry", { filter_limit: 6 }),
    q("DevicesDetection.getType"),
    q("DevicesDetection.getOsFamilies", { filter_limit: 5 }),
    q("Events.getCategory", { flat: 1, secondaryDimension: "eventAction", filter_limit: 20 }),
  ]);
  return {
    besuche: summe.nb_visits ?? 0,
    aktionen: summe.nb_actions ?? 0,
    absprungrate: summe.bounce_rate ?? null,
    aktionen_pro_besuch: summe.nb_actions_per_visit ?? null,
    dauer_sekunden: summe.avg_time_on_site ?? null,
    seitenaufrufe: aktionen.nb_pageviews ?? 0,
    klicks_nach_draussen: aktionen.nb_outlinks ?? 0,
    seiten: zeilen(seiten, ["nb_hits", "nb_visits"], 12),
    links_nach_draussen: zeilen(ausgang, ["nb_hits", "nb_visits"]),
    kanaele: zeilen(kanaele),
    websites: zeilen(websites, ["nb_visits"], 8),
    suchmaschinen: zeilen(suche, ["nb_visits"], 5),
    kampagnen: zeilen(kampagnen, ["nb_visits"], 5),
    laender: zeilen(laender, ["nb_visits"], 6),
    geraete: zeilen(geraete).filter((z) => z.nb_visits > 0),
    systeme: zeilen(systeme, ["nb_visits"], 5),
    ereignisse: zeilen(ereignisse, ["nb_events", "nb_visits"], 20),
  };
}

async function tageskurve(idSite) {
  const [r] = await bulk([{ method: "VisitsSummary.getVisits", idSite, period: "day", date: `${tag(berlinHeute, -28)},${tag(berlinHeute, -1)}`, format: "json" }]);
  return Object.entries(r || {}).map(([datum, besuche]) => ({ datum, besuche: Number(besuche) || 0 }));
}

// ------------------------------------------------------------ Los
const ergebnis = {
  erstellt: new Date().toISOString(),
  zeitraum: diese, vergleich: vorher,
  quelle: API.replace(/index\.php$/, ""),
  websites: [],
};
for (const s of SITES) {
  console.error(`Hole ${s.name} (Website ${s.id}) …`);
  ergebnis.websites.push({
    id: s.id, name: s.name,
    woche: await zeitraum(s.id, diese),
    vorwoche: await zeitraum(s.id, vorher),
    tage: await tageskurve(s.id),
  });
}
writeFileSync("zahlen.json", JSON.stringify(ergebnis));

// Kurze Übersicht für Menschen; die Deutung schreibt die Routine.
const pfeil = (a, b) => (b ? `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)} %` : a ? "neu" : "–");
let md = `### Wochenwerte ${kurz(diese.von)}–${kurz(diese.bis)}${diese.bis.slice(0, 4)} (Vergleich ${kurz(vorher.von)}–${kurz(vorher.bis)})\n\n`;
md += "| Website | Besuche | Seitenaufrufe | Klicks nach draußen | Absprung |\n|---|---:|---:|---:|---:|\n";
for (const w of ergebnis.websites) {
  md += `| ${w.name} | ${w.woche.besuche} (${pfeil(w.woche.besuche, w.vorwoche.besuche)}) | ${w.woche.seitenaufrufe} (${pfeil(w.woche.seitenaufrufe, w.vorwoche.seitenaufrufe)}) | ${w.woche.klicks_nach_draussen} | ${w.woche.absprungrate ?? "–"} |\n`;
}
md += `\n<details><summary>Rohdaten (JSON, für die Routine)</summary>\n\n\`\`\`json\n${JSON.stringify(ergebnis)}\n\`\`\`\n</details>\n`;
if (md.length > 60000) md = md.slice(0, 60000) + "\n…(gekürzt)\n";
writeFileSync("zahlen.md", md);
console.error("Fertig.");
