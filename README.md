# timatch-web — die Landingpage für timatch.de

Statische Seite, zweisprachig (Deutsch unter `/`, Englisch unter `/en/`), gehostet auf GitHub Pages.
Sie bewirbt die iOS-App **Timatch** (Repo `timatch-app`) und zeigt sie in vier kurzen Videos, die
aus der echten App stammen.

**Nicht zu verwechseln mit `timatch-website`.** Das ist ein anderes Repo und bedient
`app.timatch.de` — Hilfe, Support, Datenschutz. Dessen Adressen stehen in App Store Connect und in
der App selbst; sie bleiben unangetastet. Diese Seite hier verlinkt nur dorthin.

---

## Was hier drin ist

```
index.html            deutsche Fassung
en/index.html         englische Fassung
404.html              Fehlerseite (zweisprachig)
assets/css/site.css   das gesamte Aussehen — eine Datei, kein Framework
assets/js/site.js     Einblenden beim Scrollen, Videos nur im Bild abspielen
assets/js/scene.js    die 3D-Szene im Kopfbereich
assets/vendor/        Three.js, lokal (siehe unten)
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

**Die eigene Domain braucht einen DNS-Eintrag bei STRATO** (dort liegt `timatch.de`). Solange der
fehlt, ist die Seite nur unter der `github.io`-Adresse erreichbar. Nötig sind vier A-Einträge auf
die Adressen von GitHub Pages:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Danach in diesem Repo eine Datei `CNAME` mit dem Inhalt `timatch.de` anlegen und pushen; GitHub
stellt daraufhin automatisch ein Let's-Encrypt-Zertifikat aus (kann eine Stunde dauern).

**Das Repo muss öffentlich bleiben** — GitHub Pages veröffentlicht im kostenlosen Tarif nur aus
öffentlichen Repos. Das ist derselbe Grund, aus dem `timatch-website` öffentlich ist.
