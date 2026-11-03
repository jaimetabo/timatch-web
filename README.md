# timatch-web — die Landingpage für timatch.de

Statische Seite, zweisprachig (Deutsch unter `/`, Englisch unter `/en/`), gehostet auf GitHub Pages.
Sie bewirbt die iOS-App **Timatch** (Repo `timatch-app`) und die Web-App **Timatch Web** unter
`app.timatch.de` (Repo `timatch-tisch`) — mit echten Aufnahmen beider Apps in selbst gezeichneten
Geräterahmen (iPhone, Android, iPhone Duo).

Sie trägt Landingpage, Hilfe (`/hilfe/`, `/hilfe/tisch/`, `/en/support/`) und Rechtstexte
(`/datenschutz/`, `/impressum/`, `/agb/`, `/en/privacy/`, `/en/legal-notice/`, `/en/terms/`). Das frühere Repo
`timatch-website` ist archiviert. `app.timatch.de` ist seit 18.09.2026 die Web-App; alte Hilfe-
und Rechtstext-Adressen dort leitet deren `_redirects`-Datei hierher (siehe unten).

---

## Was hier drin ist

```
index.html            deutsche Landingpage
en/index.html         englische Landingpage
hilfe/                Hilfe & FAQ (deutsch), hilfe/tisch/ für die Web-App
datenschutz/          Datenschutzerklärung (deutsch)
impressum/            Impressum (deutsch)
agb/                  AGB, Widerrufsbelehrung, Muster-Widerrufsformular (deutsch) + PDF der Fassung
en/support/           Support & FAQ (englisch)
en/privacy/           Privacy Policy (englisch)
en/legal-notice/      Impressum (englisch)
en/terms/             Terms and Conditions (englisch) + PDF der Fassung
hilfe.html, datenschutz.html, support.html, privacy.html
                      Auffangseiten für alte Adressen (meta refresh, nicht löschen)
404.html              Fehlerseite (zweisprachig)
assets/css/site.css   das gesamte Aussehen — eine Datei, kein Framework
assets/js/site.js     Einblenden beim Scrollen, Video nur im Bild abspielen, Duo-Umschalter
assets/app/           Aufnahmen der iPhone-App (WebP, DE/EN) + das Partie-Video im Hero
assets/web/           Aufnahmen von Timatch Web (WebP, DE/EN)
assets/img/           App-Symbol (Favicon, Vorschaubild fürs Teilen)
robots.txt, sitemap.xml, .well-known/security.txt
```

## Sicherheit

Die Seite ist bewusst so gebaut, dass sie **nichts von fremden Servern lädt** — kein CDN, kein
Webfont, kein fremdes Skript, keine Cookies, kein Formular. Das ist keine Zierde: Timatch steht im
App Store mit „Data Not Collected". Eine Landingpage mit drei Trackern würde dieses Versprechen an
der Haustür brechen.

**Reichweitenmessung (seit 03.11.2026).** Gezählt wird mit unserem eigenen Matomo auf Jaimes
Strato-Webspace (`https://jaimetaboada.com/matomo/`, Website-ID **2** = timatch.de, **3** =
app.timatch.de). Bewusst *nicht* mit `matomo.js`: `assets/js/messung.js` (≈ 60 Zeilen) schickt
Seitenaufruf und Klicks nach draußen direkt an `matomo.php`, ohne Parameter in den Adressen
(nur `mtm_`/`utm_`-Kampagnen bleiben), ohne Cookies, ohne Geräteeigenschaften. Matomo selbst ist für
diese Websites auf „immer ohne Cookies", IP −2 Bytes (auch für den Standort) und Referrer ohne
Query eingestellt — nur für diese Sites, nicht für die ganze Instanz. Do Not Track / Global Privacy
Control und der Schalter auf der Datenschutzseite (`localStorage["timatch-messung"] = "aus"`)
schalten die Zählung ab. Darum steht in der CSP `connect-src https://jaimetaboada.com` statt
`'none'`; `script-src` bleibt `'self'`. Die iPhone-App misst nichts, „Data Not Collected" bleibt.
Jeden Sonntag holt `.github/workflows/zahlen.yml` die Wochenwerte (Secret `MATOMO_TOKEN`, Benutzer
`timatch-bericht`, nur Lesezugriff auf 2 und 3) in das Issue mit dem Label `zahlen-daten`; eine
Claude-Routine fasst sie danach zusammen und schickt eine Push-Nachricht.

Seit es das freiwillige Timatch-Konto, Anmelden mit Apple/Google und Pro-Käufe übers Konto gibt
(September 2026), stimmt „Data Not Collected" für die App nur noch ohne Konto. Die Angaben zum
Datenschutz in App Store Connect müssen vor dem Release mit dem Konto angepasst werden (E-Mail,
Nutzerinhalte, Käufe — jeweils „mit dir verknüpft", kein Tracking). Die Datenschutzerklärung
(`/datenschutz/`, `/en/privacy/`) beschreibt den Stand vom 03.11.2026 (Abschnitt 8: Hosting und
Reichweitenmessung).

Daraus folgt die Inhaltsrichtlinie im Kopf jeder Seite:

```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
media-src 'self'; font-src 'self'; connect-src https://jaimetaboada.com; object-src 'none';
base-uri 'none'; form-action 'none'; upgrade-insecure-requests
```

Zwei Dinge dazu, die man wissen muss:

- **`style-src 'self'` verbietet auch `style`-Attribute im HTML.** Beim Bauen war deshalb ein Video,
  das eigentlich nur eine Textur liefert, in voller Größe über dem Kopfbereich zu sehen — sein
  `style="…"` wurde ersatzlos ignoriert. Alle Stile stehen darum in `site.css`. Wer hier ein
  `style="…"` einfügt, sieht es nicht wirken. `'unsafe-inline'` zu ergänzen wäre der bequeme Weg
  und würde genau die Lücke aufmachen, gegen die die Richtlinie schützt.
- **`frame-ancestors` fehlt bewusst.** Als `<meta>` wird die Regel vom Browser ignoriert; sie in den
  Kopf zu schreiben würde nur Sicherheit vortäuschen. GitHub Pages kann keine eigenen HTTP-Kopfzeilen
  setzen — wer Klickjacking-Schutz braucht, müsste die Seite hinter etwas legen, das Header setzt.

Weiter:

- **HTTPS erzwingen** ist in den Repo-Einstellungen unter *Pages → Enforce HTTPS* eingeschaltet.
- Alle Verweise nach außen tragen `rel="noopener noreferrer"`.
- `.well-known/security.txt` nennt eine Adresse für Sicherheitsmeldungen. **`Expires` steht auf
  2027-08-23** — läuft es ab, gilt die Datei als ungültig. Spätestens im Sommer 2027 um ein Jahr
  hochsetzen.

## Fassungsnummern an CSS und JS

Die Verweise tragen `?v=N` (Stand: `site.css?v=21`, `site.js?v=20`, `messung.js?v=21`). **Beim Ausliefern einer Änderung an `site.css` oder
`site.js` diese Zahl in ALLEN HTML-Dateien hochzählen** — sonst liefern Browser die alte
Datei aus ihrem Zwischenspeicher aus. Genau das hat beim Bauen eine Viertelstunde gekostet, weil
eine Korrektur nach der anderen unsichtbar blieb.

```bash
grep -rl 'site\.css?v=20' --include=index.html --include='*.html' . \
  | xargs sed -i '' -e 's/site\.css?v=20/site.css?v=21/' -e 's/site\.js?v=20/site.js?v=21/'
```

## Bildmaterial

Alle Bildschirme sind **echte Aufnahmen**, keine Nachbauten: die iPhone-App (Build 31, Dunkelmodus,
Testdaten aus `Timatch-Testdaten.json`) und Timatch Web (die Play-Store-Aufnahmen aus
`timatch-tisch/play-store/grafiken/`). Die Geräterahmen sind reines CSS (`.iphone`, `.android`,
`.duo-flach`, `.duo-laptop`, `.duo-zu` in `site.css`) — keine Produktfotos und keine
Gerätevorlagen von Apple oder aus Xcode.

| Datei | Inhalt | Entstanden |
|---|---|---|
| `assets/app/partie-film-*.mp4` | Hero-Video: Zugwechsel Anna → Ben → Cleo → David, Ring zählt herunter | Simulator, `simctl io recordVideo`, 10,5 s geschnitten, H.264 720 px |
| `assets/app/partie-film-*.webp` | Standbild = erstes Bild des Videos (kein Sprung beim Start) | aus dem Video |
| `assets/app/budget-*.webp`, `denken-*` | Schachuhr, gleichzeitige Denkphase | `SCREENSHOT_PARTIE=4,budget` / `4,denken` |
| `assets/app/zettel-*`, `zusammenfassung-*` | Agricola-Wertungsblock, „Anna hat gewonnen" | jüngste abgeschlossene Agricola-Partie |
| `assets/app/sammlung-*`, `statistik-*`, `start-*`, `partie-*` | Bereiche der App | `SCREENSHOT_SECTION=…`, `SCREENSHOT_PARTIE=4,limit` |
| `assets/app/duo-aussen-*` | iPhone Duo zugeklappt, Außendisplay | echter Duo-Simulator (iOS 27.2), Screen 1 |
| `assets/app/duo-flach-*`, `duo-laptop-*` | Duo-Tisch aufgeklappt / halb aufgestellt | Duo-Prüfstand der App (`DUO_SIMULIEREN=1`, `SCREENSHOT_FALZ=waagerecht`) auf iPad mini, siehe unten |
| `assets/web/*` | Timatch Web | `timatch-tisch/play-store/grafiken/{de,en}` |

**Erneuern** (Mac mit Xcode 27.2): im App-Repo einen Debug-Build für den Simulator bauen, die App
mit `SIMCTL_CHILD_SEED_TESTDATA=1` und `Timatch-Testdaten.json` im Dokumente-Ordner einmal starten
(wie `tools/seed_robust.sh`), Statusleiste auf 9:41 stellen (`simctl status_bar … override`),
Erscheinungsbild dunkel (`simctl ui … appearance dark`), dann je Zustand mit
`SIMCTL_CHILD_SCREENSHOT_PRO=1 SIMCTL_CHILD_<ZUSTAND> xcrun simctl launch <gerät> com.timatch.app
-AppleLanguages "(de)"` starten, rund 25 Sekunden warten und `simctl io … screenshot` aufnehmen.
Umrechnen: `cwebp -q 84 -m 6 -sharp_yuv -resize 720 0`.

**Duo-Innendisplay:** Der Duo-Simulator lässt sich per Befehl nicht aufklappen (nur im Device Hub
von Hand). Die Bilder des aufgeklappten Duo-Tischs stammen deshalb aus dem Duo-Prüfstand der App,
der genau dieselbe Duo-Ansicht auf einem iPad mini zeigt (vom App-Code selbst als nächstliegende
Größe empfohlen: 744 × 1133 pt gegenüber 669 × 951 pt beim Duo). Wer den „Website iPhone Duo"-
Simulator einmal im Device Hub aufklappt, kann sie mit `simctl io … screenshot --display=3` durch
Aufnahmen vom echten Innendisplay ersetzen.

## Lokal ansehen

```bash
cd ~/Developer/Timatch/timatch-web
python3 -m http.server 8790 --bind 127.0.0.1
# http://127.0.0.1:8790/  (nicht 8765 — dort läuft Timatch Web mit Service Worker)
```

Ein Hinweis aus der Praxis: Chrome hält CSS und JS hartnäckig fest. Wenn eine Änderung nicht
ankommt, ist es fast immer der Zwischenspeicher — Fassungsnummer hochzählen oder mit leerem
Zwischenspeicher neu laden.

## Ausliefern

GitHub Pages baut aus dem Zweig `main`, Wurzel `/`. Ein `git push` genügt.

**DNS bei Cloudflare — seit dem 6. September 2026.** Die Zone liegt im Cloudflare-Konto
(Free-Tarif); registriert bleibt die Domain bei STRATO, Paket TIMATCH (7070811). Dort stehen unter
Domainverwaltung → timatch.de → DNS → NS-Record die **eigenen Nameserver**:

```
edna.ns.cloudflare.com
piotr.ns.cloudflare.com
```

Die Einträge in Cloudflare (Stand 29.09.2026):

| Typ | Name | Ziel | Modus |
|---|---|---|---|
| A ×4 | `timatch.de` | `185.199.108/109/110/111.153` (GitHub Pages) | DNS only |
| CNAME | `www` | `jaimetabo.github.io` | DNS only |
| CNAME | `app` | `timatch-tisch.pages.dev` (Web-App, Cloudflare Pages) | **Proxied** |
| Worker-Domain | `api` | Worker `timatch-tisch-api` (Custom Domain, von Cloudflare selbst angelegt) | **Proxied** |
| CNAME | `autoconfig` | `autoconfigure.strato.de` | DNS only |
| MX | `*` und `timatch.de` | `smtpin.rzone.de` (5) | DNS only |
| CNAME | `brevo1._domainkey`, `brevo2._domainkey` | Brevo (DKIM der Anmelde-Mails) | DNS only |
| TXT | `timatch.de` | `brevo-code:…` (Brevo-Domainnachweis) | DNS only |
| SRV / TXT | `_autodiscover`, `_dmarc` (`p=reject`), `_domainkey` | von STRATO übernommen | DNS only |

**Warum `timatch.de` selbst DNS only bleibt:** GitHub Pages liefert die Seite direkt aus und bringt
sein eigenes Zertifikat mit. Cloudflare macht hier nur die Namensauflösung. Proxied sind `app` und
`api`, weil Cloudflare diese beiden selbst beantwortet (Pages und Worker).

**Was der Umzug gebracht hat:** STRATO erlaubte in diesem Paket **genau einen** A-Eintrag; GitHub
empfiehlt vier. Jetzt stehen alle vier da. Und `app.timatch.de` kann HTTPS, was bei STRATO
unmöglich war.

**Mail:** Die MX-Einträge der Zone zeigen weiter auf STRATO (`smtpin.rzone.de`), und darüber kommt
Post an `@timatch.de` an. **Adressen seit 23.09.2026:** `support@timatch.de` für Hilfe und Fehler (Hilfe-Seiten, Fuß-Spalte
„Hilfe", Web-App, Anmelde-Mail als Antwortadresse, Play Store); `hello@timatch.de` für Rechtliches und
allgemein (Impressum, Datenschutz, security.txt, Absender der Anmelde-Mail). Beide kommen per Catch-all an. Dieselbe
Adresse ist bei Brevo als Absender der Anmelde-Mails verifiziert; timatch.de ist dort per DKIM
authentifiziert (CNAMEs `brevo1/brevo2._domainkey`). DMARC steht auf `p=reject`.

**Rechtstexte:** Impressum, AGB und Datenschutz liegen auf timatch.de (`/impressum/`, `/agb/`,
`/datenschutz/`, `/en/legal-notice/`, `/en/terms/`, `/en/privacy/`), nicht mehr auf jaimetaboada.com.
Jede Unterseite verlinkt sie im Fuß (`.fuss-recht`). Die AGB gibt es zusätzlich als PDF je Fassung
(`/agb/timatch-agb-JJJJ-MM-TT.pdf`) — die Kaufbestätigung von Timatch Web hängt genau diese Datei an
(`worker/src/terms.js` im Repo `timatch-tisch`). Bei einer neuen Fassung neues PDF anlegen, das alte
liegen lassen.

### `app.timatch.de`

**Seit dem 18. September 2026 ist `app.timatch.de` die Web-App „Timatch Web"** (Repo
`jaimetabo/timatch-tisch`, privat, Cloudflare Pages, Projekt `timatch-tisch`). Die Redirect Rule
unten ist damit Geschichte — sie musste im Cloudflare-Dashboard gelöscht und der DNS-Eintrag `app`
auf `CNAME timatch-tisch.pages.dev` (proxied) umgestellt werden. Die alten Hilfe- und
Rechtstext-Adressen unter `app.timatch.de/…` fängt jetzt eine `_redirects`-Datei im Tisch-Repo ab
und schickt sie nach `timatch.de`; die vier `meta refresh`-Seiten hier bleiben trotzdem, für
Links, die direkt auf `timatch.de/hilfe.html` zeigen.

Zur Geschichte — so war es vom 6. bis 18. September 2026 (damals `A app 217.160.0.19`, proxied):

Die alte Adresse zeigte **nicht mehr auf GitHub**, sondern wurde von
Cloudflare beantwortet. Eine Redirect Rule schickte sie dauerhaft weiter:

```
(http.host eq "app.timatch.de")
  → 301 → concat("https://timatch.de", http.request.uri.path)
```

Ein eigenes Repository mit fünf Platzhalterseiten war für eine reine Weiterleitung zu viel
Apparat; das frühere `timatch-website` ist deshalb archiviert.

**Die Regel behält den Pfad bei.** `app.timatch.de/hilfe.html` landet also auf
`timatch.de/hilfe.html` — eine Adresse, die es hier nicht mehr gibt. Deshalb liegen im
Wurzelverzeichnis vier Weiterleitungsseiten (`hilfe.html`, `datenschutz.html`, `support.html`,
`privacy.html`), die per `meta refresh` auf `/hilfe/`, `/datenschutz/`, `/en/support/` und
`/en/privacy/` zeigen. Sie tragen `noindex, follow` und ein `canonical` auf das Ziel.
**Nicht löschen** — ohne sie enden die alten Adressen im 404.

Prüfen (heute: `/` liefert 200 mit der Web-App, die vier alten Adressen 301 nach timatch.de):

```bash
for p in / /hilfe.html /datenschutz.html /support.html /privacy.html; do
  curl -sIo /dev/null -w "$p %{http_code} -> %{redirect_url}\n" "https://app.timatch.de$p"
done
```


**Das Repo muss öffentlich bleiben** — GitHub Pages veröffentlicht im kostenlosen Tarif nur aus
öffentlichen Repos.

## `.nojekyll`

Die leere Datei im Wurzelverzeichnis schaltet Jekyll ab. Ohne sie **veröffentlicht GitHub Pages
keine Ordner, die mit einem Punkt beginnen** — `/.well-known/security.txt` kam mit 404 zurück,
obwohl die Datei im Repo lag. Nicht löschen.
