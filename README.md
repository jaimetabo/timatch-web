# timatch-web — die Landingpage für timatch.de

Statische Seite, zweisprachig (Deutsch unter `/`, Englisch unter `/en/`), gehostet auf GitHub Pages.
Sie bewirbt die iOS-App **Timatch** (Repo `timatch-app`) und zeigt sie in vier kurzen Videos, die
aus der echten App stammen.

Sie trägt **alles**: Landingpage, Hilfe (`/hilfe/`, `/en/support/`) und Rechtstexte
(`/datenschutz/`, `/en/privacy/`). Es gibt kein zweites Website-Repo mehr — das frühere
`timatch-website` hinter `app.timatch.de` ist am 6. September 2026 weggefallen, seine
Weiterleitungen macht jetzt ein `.htaccess` auf dem Strato-Webspace.

---

## Was hier drin ist

```
index.html            deutsche Landingpage
en/index.html         englische Landingpage
hilfe/                Hilfe & FAQ (deutsch)
datenschutz/          Datenschutzerklärung (deutsch)
en/support/           Support & FAQ (englisch)
en/privacy/           Privacy Policy (englisch)
404.html              Fehlerseite (zweisprachig)
assets/css/site.css   das gesamte Aussehen — eine Datei, kein Framework
assets/js/site.js     Einblenden beim Scrollen, Videos nur im Bild abspielen
assets/js/scene.js    die 3D-Szene im Kopfbereich
assets/vendor/        Three.js + Zusatzmodule, lokal (siehe unten)
assets/video/         vier Videos aus der App + je ein Standbild als Poster
assets/img/           App-Symbol (Favicon, Vorschaubild fürs Teilen)
robots.txt, sitemap.xml, .well-known/security.txt
```

## Sicherheit

Die Seite ist bewusst so gebaut, dass sie **nichts von fremden Servern lädt** — kein CDN, kein
Webfont, kein Analysewerkzeug, keine Cookies, kein Formular. Das ist keine Zierde: Timatch steht im
App Store mit „Data Not Collected". Eine Landingpage mit drei Trackern würde dieses Versprechen an
der Haustür brechen.

Daraus folgt die Inhaltsrichtlinie im Kopf jeder Seite:

```
default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
media-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none';
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
- `.well-known/security.txt` nennt eine Adresse für Sicherheitsmeldungen. **Das `Expires`-Datum
  steht auf einem Jahr** — läuft es ab, gilt die Datei als ungültig. Beim nächsten größeren Umbau
  bitte hochsetzen.

### Three.js

`assets/vendor/three.module-0.185.1.min.js` und `three.core-0.185.1.min.js` stammen aus dem
npm-Paket `three@0.185.1`. Die Prüfsumme des heruntergeladenen Pakets stimmte mit der Angabe der
Registry überein (`sha512-5aojFCXKwnjBRZvUnt3WFfEcvUJgkN5LlijRFN95hMy8WVkG4I0QNcJE+OuWvuJ0bOdStrbfXn0pkd6/QyiAlg==`).

```
SHA-256 three.module-0.185.1.min.js  86bcee248b64f44bcfc23c331ae74619061957d59cab040171dcb6fb5900beb6
SHA-256 three.core-0.185.1.min.js    05b2609338c76cd65daf74f3ac515bc9a5045e1b3b33edc07d8c9bd55250fa90
```

Im Modul ist genau eine Zeile geändert: der Import zeigt auf die versionierte Kerndatei
(`./three.core-0.185.1.min.js` statt `./three.core.min.js`). Beim Aktualisieren beide Dateien
tauschen, den Import erneut umbiegen und die Prüfsummen hier nachtragen.

Unter `assets/vendor/three-addons/` liegen sechs Zusatzmodule aus demselben Paket
(`examples/jsm`): `RoomEnvironment`, `RoundedBoxGeometry`, `EffectComposer`, `RenderPass`,
`UnrealBloomPass`, `OutputPass` samt ihren Abhängigkeiten. Sie importieren im Original `from
'three'` bzw. `from 'three/addons/…'`; beides zeigt hier auf relative Pfade. **Eine Importkarte
(`<script type="importmap">`) wäre der übliche Weg gewesen — sie ist ein Inline-Skript und würde
eine Ausnahme in der Inhaltsrichtlinie erzwingen.** Umgebogene Pfade kosten nichts und lassen die
Richtlinie streng.

## Fassungsnummern an CSS und JS

Die Verweise tragen `?v=N`. **Beim Ausliefern einer Änderung an `site.css`, `site.js` oder
`scene.js` diese Zahl in allen drei HTML-Dateien hochzählen** — sonst liefern Browser die alte
Datei aus ihrem Zwischenspeicher aus. Genau das hat beim Bauen eine Viertelstunde gekostet, weil
eine Korrektur nach der anderen unsichtbar blieb.

```bash
sed -i '' 's/?v=3"/?v=4"/g' index.html en/index.html 404.html
```

## Die Videos

Sie entstehen im App-Repo, nicht hier:

```bash
cd ~/Developer/Timatch/timatch-app
bash tools/website_footage.sh          # alle vier Szenen
```

Das Skript führt die App über einen UI-Prüfstand vor und nimmt dabei auf. Ergebnis liegt in
`build/website-video/`; von dort werden die Dateien hierher kopiert:

| Datei | Szene |
|---|---|
| `timer.mp4` | Der Zug-Timer läuft, die Runde wird weitergeschaltet |
| `punkte.mp4` | Punkte werden Zeile für Zeile eingetragen, die Summe rechnet mit |
| `sammlung.mp4` | Durch die Spielesammlung scrollen |
| `statistik.mp4` | Die Auswertung |

Das `timer.mp4` läuft zusätzlich als Textur auf dem Gerät in der 3D-Szene.

## Lokal ansehen

```bash
cd ~/Developer/Timatch/timatch-web
python3 -m http.server 8765 --bind 127.0.0.1
# http://127.0.0.1:8765/
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

Die Einträge in Cloudflare:

| Typ | Name | Ziel | Modus |
|---|---|---|---|
| A ×4 | `timatch.de` | `185.199.108/109/110/111.153` | DNS only |
| CNAME | `www` | `jaimetabo.github.io` | DNS only |
| A | `app` | `217.160.0.19` | **Proxied** |
| CNAME | `autoconfig` | `autoconfigure.strato.de` | DNS only |
| MX | `*` und `timatch.de` | `smtpin.rzone.de` (5) | DNS only |
| SRV / TXT | `_autodiscover`, `_dmarc`, `_domainkey` | unverändert übernommen | DNS only |

**Warum `timatch.de` selbst DNS only bleibt:** Die Seite soll sich genau wie vorher verhalten,
GitHub Pages liefert sie direkt aus und bringt sein eigenes Zertifikat mit. Cloudflare macht hier
nur die Namensauflösung. Proxied ist einzig `app` — und zwar allein, damit die Weiterleitung ein
Zertifikat bekommt.

**Was der Umzug gebracht hat:** STRATO erlaubte in diesem Paket **genau einen** A-Eintrag; GitHub
empfiehlt vier. Jetzt stehen alle vier da. Und `app.timatch.de` kann HTTPS, was bei STRATO
unmöglich war.

**Mail:** Mit eigenen Nameservern stehen STRATOs E-Mail-Funktionen für diese Domain nicht mehr zur
Verfügung — STRATO warnt beim Umstellen ausdrücklich davor. Das war zu verschmerzen, weil keine
`@timatch.de`-Adresse in Gebrauch ist: App und Website schreiben an `timatch@jaimetaboada.com`,
also an die andere Domain im anderen Paket. Die MX-Einträge sind trotzdem mitgezogen, damit die
Zone dem alten Stand entspricht.

### `app.timatch.de`

Die alte Adresse zeigt seit dem 6. September 2026 **nicht mehr auf GitHub**, sondern wird von
Cloudflare beantwortet. Eine Redirect Rule schickt sie dauerhaft weiter:

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

Prüfen:

```bash
for p in / /hilfe.html /datenschutz.html /support.html /privacy.html; do
  curl -sIo /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://app.timatch.de$p"
done
```


**Das Repo muss öffentlich bleiben** — GitHub Pages veröffentlicht im kostenlosen Tarif nur aus
öffentlichen Repos.

## `.nojekyll`

Die leere Datei im Wurzelverzeichnis schaltet Jekyll ab. Ohne sie **veröffentlicht GitHub Pages
keine Ordner, die mit einem Punkt beginnen** — `/.well-known/security.txt` kam mit 404 zurück,
obwohl die Datei im Repo lag. Nicht löschen.
