/* Die 3D-Szene im Kopfbereich: ein Tisch im Halbdunkel, darüber schwebend ein iPhone, auf dessen
 * Bildschirm die echte App läuft (als Videotextur), umgeben von Spielsteinen in den Farben, die
 * Timatch den Mitspielenden gibt.
 *
 * Drei Dinge, die hier bewusst so gebaut sind:
 *
 * 1. **Three.js liegt im Haus.** Kein CDN. Die Datei ist aus dem npm-Paket entpackt, ihre Prüfsumme
 *    steht in der README, und die Inhaltsrichtlinie der Seite erlaubt Skripte nur von der eigenen
 *    Herkunft. Ein eingebundenes fremdes Skript darf alles, was diese Seite darf — bei einer Seite,
 *    die für eine App ohne Datensammlung wirbt, wäre das der falsche Handel.
 *
 * 2. **Es wird nur gerechnet, wenn es jemand sieht.** Sobald der Kopfbereich aus dem Bild scrollt
 *    oder der Tab in den Hintergrund geht, hält die Schleife an. Eine 3D-Szene, die unsichtbar
 *    weiterläuft, ist nichts als Akkuverbrauch.
 *
 * 3. **Ohne WebGL passiert nichts Schlimmes.** Dann bleibt schlicht der Verlauf im Hintergrund
 *    stehen, und der Text darüber steht wie immer. Die Seite hängt nicht an der Szene.
 */

import * as THREE from "../vendor/three.module-0.185.1.min.js";

const behaelter = document.getElementById("szene");
const ruhigGewuenscht = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (behaelter && !ruhigGewuenscht) {
  starte(behaelter);
}

function starte(wurzel) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (e) {
    // Kein WebGL — die Seite kommt auch ohne aus.
    return;
  }
  if (!renderer.getContext()) return;

  // Über 2 bringt die höhere Auflösung nichts Sichtbares mehr, kostet aber quadratisch Rechenzeit.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(wurzel.clientWidth, wurzel.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  wurzel.appendChild(renderer.domElement);

  const szene = new THREE.Scene();
  szene.fog = new THREE.FogExp2(0x08080c, 0.032);   // vorher 0.055 — das Gerät wirkte ausgewaschen

  const kamera = new THREE.PerspectiveCamera(38, wurzel.clientWidth / wurzel.clientHeight, 0.1, 100);
  kamera.position.set(0, 2.4, 11.5);
  kamera.lookAt(0, 0.6, 0);

  /* Wo das Gerät steht, hängt am Fensterformat.
   *
   * Auf einem breiten Bildschirm steht der Text links, also gehört das Gerät nach rechts — sonst
   * liegt es mitten in der Überschrift. Genau so sah der erste Entwurf aus: ein riesiges Telefon
   * quer über dem Titel. Auf einem Telefon ist neben dem Text kein Platz; dort rutscht es nach
   * hinten und unten und wird zur Kulisse, über der der Text steht. */
  function stelleAuf() {
    const breit = wurzel.clientWidth / Math.max(wurzel.clientHeight, 1) > 1.05;
    geraet.position.x = breit ? 3.7 : 0;
    geraet.position.z = breit ? 0 : -3.2;
    const groesse = breit ? 0.8 : 0.6;
    geraet.scale.setScalar(groesse);
    saum.visible = breit;
  }

  // ------------------------------------------------------------------ Licht
  // Warmes Hauptlicht von schräg oben wie eine Lampe über dem Spieltisch, dazu ein kalter
  // Gegenschein von hinten, damit sich die Kanten vom Hintergrund abheben.
  szene.add(new THREE.AmbientLight(0x40405a, 1.1));

  const lampe = new THREE.DirectionalLight(0xffc98a, 3.2);
  lampe.position.set(4, 7, 4);
  szene.add(lampe);

  const gegenlicht = new THREE.DirectionalLight(0x6aa8ff, 1.5);
  gegenlicht.position.set(-6, 3, -5);
  szene.add(gegenlicht);

  const punktlicht = new THREE.PointLight(0xff8a2b, 22, 16, 2);
  punktlicht.position.set(0, 1.6, 2.5);
  szene.add(punktlicht);

  // ------------------------------------------------------------------ Tisch
  const tisch = new THREE.Mesh(
    new THREE.CircleGeometry(11, 64),
    new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.94, metalness: 0.05 })
  );
  tisch.rotation.x = -Math.PI / 2;
  tisch.position.y = -1.5;
  szene.add(tisch);

  // ------------------------------------------------------------------ Das Gerät
  const geraet = new THREE.Group();
  szene.add(geraet);

  const gehaeuse = new THREE.Mesh(
    rundeBox(2.05, 4.3, 0.19, 0.3, 5),
    new THREE.MeshStandardMaterial({ color: 0x2a2a33, roughness: 0.32, metalness: 0.85 })
  );
  geraet.add(gehaeuse);

  // Der Bildschirm: die echte App als Videotextur. Das Video liegt versteckt im HTML — ein
  // eigenes <video> statt eines zweiten Downloads, damit der Browser es genau einmal lädt.
  const videoElement = document.getElementById("szene-video");
  let bildschirmMaterial;
  if (videoElement) {
    const textur = new THREE.VideoTexture(videoElement);
    textur.colorSpace = THREE.SRGBColorSpace;
    bildschirmMaterial = new THREE.MeshBasicMaterial({ map: textur });
    // `play()` kann abgelehnt werden (Energiesparmodus, Datensparmodus). Das ist kein Fehler,
    // sondern eine Entscheidung des Geräts — dann bleibt das Standbild stehen.
    const versuch = videoElement.play();
    if (versuch && versuch.catch) versuch.catch(() => {});
  } else {
    bildschirmMaterial = new THREE.MeshBasicMaterial({ color: 0x101018 });
  }
  const bildschirm = new THREE.Mesh(new THREE.PlaneGeometry(1.87, 4.12), bildschirmMaterial);
  bildschirm.position.z = 0.101;
  geraet.add(bildschirm);

  // Ein schmaler Lichtsaum am Gehäuserand — er trennt das Gerät optisch vom dunklen Grund.
  const saum = new THREE.Mesh(
    rundeBox(2.13, 4.38, 0.02, 0.32, 5),
    new THREE.MeshBasicMaterial({ color: 0xffa749, transparent: true, opacity: 0.16 })
  );
  saum.position.z = -0.11;
  geraet.add(saum);

  stelleAuf();

  // ------------------------------------------------------------------ Spielsteine
  // Die vier Farben sind dieselben, die Timatch den Mitspielenden am Tisch gibt.
  const farben = [0xff9500, 0x34c759, 0xaf52de, 0x5ac8fa];
  const steine = [];

  // Achtzehn waren zu viele und lagen quer über der Überschrift. Zwölf, weiter außen und weiter
  // hinten — sie sollen den Raum andeuten, nicht um Aufmerksamkeit mit dem Text konkurrieren.
  for (let i = 0; i < 12; i++) {
    const farbe = farben[i % farben.length];
    const material = new THREE.MeshStandardMaterial({
      color: farbe, roughness: 0.36, metalness: 0.15,
      emissive: farbe, emissiveIntensity: 0.16,
    });

    let form;
    const art = i % 3;
    if (art === 0) form = rundeBox(0.42, 0.42, 0.42, 0.09, 3);        // Würfel
    else if (art === 1) form = new THREE.CylinderGeometry(0.26, 0.26, 0.11, 24); // Marker
    else form = new THREE.IcosahedronGeometry(0.26, 0);                // Kristall

    const stein = new THREE.Mesh(form, material);
    // Im Ring um das Gerät verteilt, mit etwas Zufall, damit es nicht wie ein Zahnrad aussieht.
    const winkel = (i / 12) * Math.PI * 2 + (i % 5) * 0.21;
    const abstand = 5.4 + ((i * 37) % 100) / 100 * 2.6;
    stein.position.set(
      Math.cos(winkel) * abstand,
      -1.0 + ((i * 53) % 100) / 100 * 3.4,
      // Deutlich nach hinten: So liegen sie hinter dem Gerät und nicht zwischen Kamera und Text.
      Math.sin(winkel) * abstand * 0.5 - 3.2
    );
    stein.rotation.set(i * 0.7, i * 1.3, i * 0.4);
    stein.userData.tempo = 0.25 + ((i * 29) % 100) / 100 * 0.5;
    stein.userData.hub = 0.1 + ((i * 17) % 100) / 100 * 0.22;
    stein.userData.grund = stein.position.y;
    szene.add(stein);
    steine.push(stein);
  }

  // ------------------------------------------------------------------ Bewegung

  let zeiger = { x: 0, y: 0 };
  let laeuft = true;
  let sichtbar = true;
  let scrollAnteil = 0;

  window.addEventListener("pointermove", (e) => {
    zeiger.x = (e.clientX / window.innerWidth) * 2 - 1;
    zeiger.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  window.addEventListener("scroll", () => {
    const hoehe = wurzel.clientHeight || 1;
    scrollAnteil = Math.min(window.scrollY / hoehe, 1);
  }, { passive: true });

  // Nur rechnen, wenn die Bühne auch im Bild ist.
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((eintraege) => {
      sichtbar = eintraege[0].isIntersecting;
      if (sichtbar && laeuft) schleife();
    }, { threshold: 0.01 }).observe(wurzel);
  }
  document.addEventListener("visibilitychange", () => {
    laeuft = !document.hidden;
    if (laeuft && sichtbar) schleife();
  });

  window.addEventListener("resize", () => {
    const b = wurzel.clientWidth, h = wurzel.clientHeight;
    kamera.aspect = b / h;
    kamera.updateProjectionMatrix();
    renderer.setSize(b, h);
    stelleAuf();
  }, { passive: true });

  const uhr = new THREE.Clock();
  let angefordert = false;

  function schleife() {
    if (angefordert) return;
    angefordert = true;
    requestAnimationFrame(bild);
  }

  function bild() {
    angefordert = false;
    if (!laeuft || !sichtbar) return;

    const t = uhr.getElapsedTime();

    // Das Gerät atmet leicht und folgt dem Zeiger — dezent, sonst wirkt es zappelig.
    geraet.position.y = -0.1 + Math.sin(t * 0.6) * 0.12 - scrollAnteil * 1.6;
    // x/z setzt `stelleAuf()`; hier wird nur die Höhe bewegt.
    geraet.rotation.y = -0.18 + Math.sin(t * 0.35) * 0.09 + zeiger.x * 0.16;
    geraet.rotation.x = 0.04 + Math.cos(t * 0.28) * 0.04 + zeiger.y * 0.07;

    for (const stein of steine) {
      stein.rotation.x += 0.0016 * stein.userData.tempo * 60 * 0.016;
      stein.rotation.y += 0.0021 * stein.userData.tempo * 60 * 0.016;
      stein.position.y = stein.userData.grund + Math.sin(t * stein.userData.tempo + stein.id) * stein.userData.hub;
    }

    // Beim Scrollen fährt die Kamera zurück und etwas höher — der Tisch öffnet sich.
    kamera.position.z = 11.5 + scrollAnteil * 2.6;
    kamera.position.y = 2.4 + scrollAnteil * 1.1;
    kamera.lookAt(0, 0.6 - scrollAnteil * 0.8, 0);

    renderer.render(szene, kamera);
    schleife();
  }

  schleife();
}

/* Eine Box mit gerundeten Kanten. Three.js bringt keine mit, und eine scharfkantige Box sieht neben
 * einem iPhone falsch aus — Rundungen sind das halbe Erkennungszeichen. Gebaut über eine
 * extrudierte Form mit Fase, das ist die billigste Variante ohne zusätzliche Bibliothek. */
function rundeBox(breite, hoehe, tiefe, radius, stufen) {
  const form = new THREE.Shape();
  const b = breite / 2 - radius, h = hoehe / 2 - radius;
  form.absarc(-b, -h, radius, Math.PI, Math.PI * 1.5);
  form.absarc(b, -h, radius, Math.PI * 1.5, 0);
  form.absarc(b, h, radius, 0, Math.PI * 0.5);
  form.absarc(-b, h, radius, Math.PI * 0.5, Math.PI);
  const geo = new THREE.ExtrudeGeometry(form, {
    depth: Math.max(tiefe - 0.04, 0.01),
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: stufen,
    curveSegments: stufen * 2,
  });
  geo.center();
  return geo;
}
