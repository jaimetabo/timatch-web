/* Die 3D-Szene im Kopfbereich: ein Tisch im Halbdunkel, darüber schwebend ein iPhone, auf dessen
 * Bildschirm die echte App läuft (als Videotextur), umgeben von Spielsteinen in den Farben, die
 * Timatch den Mitspielenden gibt.
 *
 * **Was die zweite Fassung anders macht.** Die erste sah aus wie bunte Klötze vor schwarzem Grund:
 * flache Materialien, kein Schatten, kein Glanz. Drei Dinge machen den Unterschied, und alle drei
 * kommen aus Three.js selbst (Ordner `examples/jsm`, hier lokal unter `vendor/three-addons`):
 *
 * 1. **Eine Umgebung zum Spiegeln.** `RoomEnvironment` erzeugt rechnerisch einen Studioraum, den
 *    `PMREMGenerator` in eine Reflexionskarte übersetzt. Erst dadurch sieht Metall nach Metall aus.
 *    Ohne sie bleibt jede noch so gut eingestellte Oberfläche stumpf — das ist der Schritt mit dem
 *    größten Unterschied, und er kostet keine einzige Bilddatei.
 * 2. **Ein weicher Schatten unter dem Gerät.** Kein echter Schattenwurf (teuer und bei einem
 *    schwebenden Objekt kaum sichtbar), sondern ein gemalter Fleck auf dem Tisch. Er ist der
 *    Unterschied zwischen „schwebt" und „klebt am Hintergrund".
 * 3. **Bloom.** Der warme Schein um den Bildschirm und die Kanten. Sparsam dosiert — zu viel davon
 *    sieht nach Jahrmarkt aus.
 *
 * **Fremdcode bleibt im Haus.** Kein CDN. Alle Dateien stammen aus dem npm-Paket `three@0.185.1`,
 * dessen Prüfsumme mit der Registry übereinstimmte (siehe README); die Import-Pfade sind auf die
 * lokale Kerndatei umgebogen. Die Inhaltsrichtlinie der Seite erlaubt Skripte weiterhin nur von
 * der eigenen Herkunft.
 *
 * **Es wird nur gerechnet, wenn es jemand sieht.** Sobald der Kopfbereich aus dem Bild scrollt oder
 * der Tab in den Hintergrund geht, hält die Schleife an.
 *
 * **Ohne WebGL passiert nichts Schlimmes.** Dann bleibt der Verlauf im Hintergrund stehen und der
 * Text darüber steht wie immer.
 */

import * as THREE from "../vendor/three.module-0.185.1.min.js";
import { RoomEnvironment } from "../vendor/three-addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "../vendor/three-addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "../vendor/three-addons/postprocessing/EffectComposer.js";
import { RenderPass } from "../vendor/three-addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../vendor/three-addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "../vendor/three-addons/postprocessing/OutputPass.js";

const behaelter = document.getElementById("szene");
const ruhigGewuenscht = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (behaelter && !ruhigGewuenscht) {
  starte(behaelter);
}

function starte(wurzel) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    return;   // Kein WebGL — die Seite kommt auch ohne aus.
  }
  if (!renderer.getContext()) return;

  const breitesFenster = () => wurzel.clientWidth / Math.max(wurzel.clientHeight, 1) > 1.05;

  // Bloom rechnet in mehreren Durchgängen über die volle Bildfläche. Bei doppelter Pixeldichte auf
  // einem Telefon ist das die Art Aufwand, die man an der Handwärme merkt — deshalb dort gedeckelt.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, breitesFenster() ? 2 : 1.5));
  renderer.setSize(wurzel.clientWidth, wurzel.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  wurzel.appendChild(renderer.domElement);

  const szene = new THREE.Scene();
  szene.fog = new THREE.FogExp2(0x08080c, 0.026);

  const kamera = new THREE.PerspectiveCamera(36, wurzel.clientWidth / wurzel.clientHeight, 0.1, 100);
  kamera.position.set(0, 2.2, 11.5);
  kamera.lookAt(0, 0.4, 0);

  // ------------------------------------------------------------------ Umgebung
  // Der Schritt mit der größten Wirkung: Ohne Reflexionskarte bleibt jedes Metall stumpf.
  const pmrem = new THREE.PMREMGenerator(renderer);
  szene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // Gedämpft. Die Umgebung soll Oberflächen Glanz geben, nicht die Szene aufhellen — bei voller
  // Stärke war der Tisch im Halbdunkel plötzlich ein heller Raum, und die Stimmung war weg.
  szene.environmentIntensity = 0.5;
  pmrem.dispose();

  // ------------------------------------------------------------------ Licht
  // Warmes Hauptlicht von schräg oben wie eine Lampe über dem Spieltisch, dazu ein kühler
  // Gegenschein von hinten, damit sich die Kanten vom dunklen Grund abheben.
  const lampe = new THREE.DirectionalLight(0xffd0a0, 2.0);
  lampe.position.set(5, 8, 4);
  szene.add(lampe);

  const gegenlicht = new THREE.DirectionalLight(0x6aa8ff, 1.1);
  gegenlicht.position.set(-7, 3, -6);
  szene.add(gegenlicht);

  const punktlicht = new THREE.PointLight(0xff8a2b, 9, 16, 2);
  punktlicht.position.set(1.5, 1.2, 3);
  szene.add(punktlicht);

  // ------------------------------------------------------------------ Tisch
  const tisch = new THREE.Mesh(
    new THREE.CircleGeometry(16, 64),
    new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.82, metalness: 0.12 })
  );
  tisch.rotation.x = -Math.PI / 2;
  tisch.position.y = -2.6;
  szene.add(tisch);

  // ------------------------------------------------------------------ Das Gerät
  const geraet = new THREE.Group();
  szene.add(geraet);

  const gehaeuse = new THREE.Mesh(
    new RoundedBoxGeometry(2.06, 4.32, 0.24, 6, 0.3),
    new THREE.MeshPhysicalMaterial({
      color: 0x55555f, roughness: 0.26, metalness: 1,
      clearcoat: 0.6, clearcoatRoughness: 0.3,
    })
  );
  geraet.add(gehaeuse);

  // Der Bildschirm: die echte App als Videotextur. Das Video liegt versteckt im HTML — ein eigenes
  // <video> statt eines zweiten Downloads, damit der Browser die Datei genau einmal lädt.
  const videoElement = document.getElementById("szene-video");
  let bildschirmMaterial;
  if (videoElement) {
    const textur = new THREE.VideoTexture(videoElement);
    textur.colorSpace = THREE.SRGBColorSpace;
    // `toneMapped: false`: Der Bildschirm ist eine Lichtquelle und kein beleuchtetes Objekt. Ohne
    // das zieht die Tonwertkurve die App-Oberfläche grau, und die Farben stimmen nicht mehr.
    bildschirmMaterial = new THREE.MeshBasicMaterial({ map: textur, toneMapped: false });
    // `play()` darf abgelehnt werden (Energiesparmodus, Datensparmodus) — dann bleibt das
    // Standbild stehen. Das ist eine Entscheidung des Geräts und kein Fehler.
    const versuch = videoElement.play();
    if (versuch && versuch.catch) versuch.catch(() => {});
  } else {
    bildschirmMaterial = new THREE.MeshBasicMaterial({ color: 0x101018 });
  }
  const bildschirm = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 4.16), bildschirmMaterial);
  bildschirm.position.z = 0.121;
  geraet.add(bildschirm);

  // Eine hauchdünne Glasscheibe darüber. Sie fängt die Umgebung ein — dadurch bekommt der
  // Bildschirm den schrägen Lichtstreifen, an dem man ein echtes Display erkennt.
  const glas = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 4.16),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, metalness: 0, roughness: 0.06,
      transparent: true, opacity: 0.09,
      clearcoat: 1, clearcoatRoughness: 0.04,
    })
  );
  glas.position.z = 0.123;
  geraet.add(glas);

  // ------------------------------------------------------------------ Schatten
  // Gemalt, nicht gerechnet: ein Fleck auf dem Tisch. Ohne ihn schwebt das Gerät im Nichts.
  const schatten = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 5.2),
    new THREE.MeshBasicMaterial({
      map: fleckTextur(), transparent: true, opacity: 0.62, depthWrite: false,
    })
  );
  schatten.rotation.x = -Math.PI / 2;
  schatten.position.y = -2.58;
  szene.add(schatten);

  // ------------------------------------------------------------------ Spielsteine
  // Die vier Farben sind dieselben, die Timatch den Mitspielenden am Tisch gibt.
  const farben = [0xff9500, 0x34c759, 0xaf52de, 0x5ac8fa];
  const steine = [];
  // Eigene Gruppe, damit die Steine mit dem Gerät wandern: Sie sollen es UMKREISEN. Vorher lagen
  // sie um den Bildmittelpunkt und damit quer über der Überschrift.
  const steineGruppe = new THREE.Group();
  szene.add(steineGruppe);

  for (let i = 0; i < 12; i++) {
    const farbe = farben[i % farben.length];
    const material = new THREE.MeshPhysicalMaterial({
      color: farbe, roughness: 0.28 + (i % 3) * 0.12, metalness: 0.08,
      clearcoat: 0.9, clearcoatRoughness: 0.18,
      emissive: farbe, emissiveIntensity: 0.05,
    });

    let form;
    const art = i % 3;
    if (art === 0) form = new RoundedBoxGeometry(0.46, 0.46, 0.46, 4, 0.1);
    else if (art === 1) form = new THREE.CylinderGeometry(0.28, 0.28, 0.12, 32);
    else form = new THREE.IcosahedronGeometry(0.28, 0);

    const stein = new THREE.Mesh(form, material);
    // Ein Fächer, kein Ring — und immer HINTER dem Gerät.
    //
    // Auf dem vollen Kreis landeten zwei Steine dort, wo sie nicht hingehören: einer schwebte vor
    // dem Bildschirm und verdeckte die App, ein anderer lag quer über der Überschrift. Ein halber
    // Kreis nach rechts (cos ≥ 0) hält die Textspalte frei, und ein durchweg negatives z hält die
    // Steine hinter dem Gerät.
    const winkel = -Math.PI / 2 + (i / 11) * Math.PI + (i % 5) * 0.06;
    const abstand = 3.2 + ((i * 37) % 100) / 100 * 3.4;
    stein.position.set(
      Math.cos(winkel) * abstand,
      -1.6 + ((i * 53) % 100) / 100 * 3.6,
      -2.4 - Math.abs(Math.sin(winkel)) * abstand * 0.5
    );
    stein.rotation.set(i * 0.7, i * 1.3, i * 0.4);
    stein.userData.tempo = 0.25 + ((i * 29) % 100) / 100 * 0.5;
    stein.userData.hub = 0.1 + ((i * 17) % 100) / 100 * 0.22;
    stein.userData.grund = stein.position.y;
    steineGruppe.add(stein);
    steine.push(stein);
  }

  // ------------------------------------------------------------------ Nachbearbeitung
  const komponist = new EffectComposer(renderer);
  komponist.addPass(new RenderPass(szene, kamera));
  // Sehr sparsam dosiert. Der erste Versuch stand auf 0.42/0.7/0.82 — damit glühte die ganze
  // Seite, das Gerät verschwand hinter seinem eigenen Schein und die Spielsteine wurden zu
  // Farbflecken. Bloom wirkt VOR der Tonwertkurve, also auf lineare Helligkeiten; die Videotextur
  // liegt dort bereits bei 1.0 und strahlt bei niedriger Schwelle ungebremst.
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(wurzel.clientWidth, wurzel.clientHeight),
    0.16,   // Stärke
    0.45,   // Radius
    1.02    // Schwelle: nur echte Glanzlichter, nicht der ganze Bildschirm
  );
  komponist.addPass(bloom);
  komponist.addPass(new OutputPass());

  // ------------------------------------------------------------------ Aufstellung
  //
  // Wo das Gerät steht, hängt am Fensterformat. Auf einem breiten Bildschirm steht der Text links,
  // also gehört das Gerät nach rechts — sonst liegt es mitten in der Überschrift. Auf einem Telefon
  // ist daneben kein Platz; dort rutscht es nach hinten und wird zur Kulisse.
  function stelleAuf() {
    const breit = breitesFenster();
    geraet.position.x = breit ? 3.7 : 0;
    geraet.position.z = breit ? 0 : -3.4;
    geraet.scale.setScalar(breit ? 0.88 : 0.62);
    schatten.position.x = geraet.position.x;
    schatten.position.z = geraet.position.z;
    schatten.visible = breit;
    steineGruppe.position.x = breit ? 4.0 : 0;
  }
  stelleAuf();

  // ------------------------------------------------------------------ Bewegung
  const zeiger = { x: 0, y: 0 };
  let laeuft = true;
  let sichtbar = true;
  let scrollAnteil = 0;

  window.addEventListener("pointermove", (e) => {
    zeiger.x = (e.clientX / window.innerWidth) * 2 - 1;
    zeiger.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  window.addEventListener("scroll", () => {
    scrollAnteil = Math.min(window.scrollY / (wurzel.clientHeight || 1), 1);
  }, { passive: true });

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
    komponist.setSize(b, h);
    bloom.setSize(b, h);
    stelleAuf();
  }, { passive: true });

  // Eigene Zeitmessung statt `THREE.Clock`: Three.js hat die Klasse für abgelehnt erklärt und
  // schreibt bei jedem Seitenaufruf eine Verfallswarnung in die Konsole.
  const begonnen = performance.now();
  let angefordert = false;

  function schleife() {
    if (angefordert) return;
    angefordert = true;
    requestAnimationFrame(bild);
  }

  function bild() {
    angefordert = false;
    if (!laeuft || !sichtbar) return;

    const t = (performance.now() - begonnen) / 1000;

    // Das Gerät atmet leicht und folgt dem Zeiger — dezent, sonst wirkt es zappelig.
    geraet.position.y = -0.1 + Math.sin(t * 0.6) * 0.12 - scrollAnteil * 1.6;
    geraet.rotation.y = -0.2 + Math.sin(t * 0.35) * 0.08 + zeiger.x * 0.15;
    geraet.rotation.x = 0.03 + Math.cos(t * 0.28) * 0.035 + zeiger.y * 0.06;

    // Der Schatten wandert und schrumpft mit der Höhe — das ist es, was ihn glaubhaft macht.
    const hoehe = geraet.position.y + 2.6;
    schatten.scale.setScalar(0.85 + hoehe * 0.05);
    schatten.material.opacity = Math.max(0.12, 0.62 - hoehe * 0.06);

    for (const stein of steine) {
      stein.rotation.x += 0.0016;
      stein.rotation.y += 0.0021;
      stein.position.y = stein.userData.grund + Math.sin(t * stein.userData.tempo + stein.id) * stein.userData.hub;
    }

    kamera.position.z = 11.5 + scrollAnteil * 2.6;
    kamera.position.y = 2.2 + scrollAnteil * 1.1;
    kamera.lookAt(0, 0.4 - scrollAnteil * 0.8, 0);

    komponist.render();
    schleife();
  }

  schleife();
}

/** Ein weicher, runder Fleck als Schattentextur — auf einem Canvas gemalt, damit keine Bilddatei
 *  geladen werden muss. */
function fleckTextur() {
  const groesse = 256;
  const c = document.createElement("canvas");
  c.width = c.height = groesse;
  const ctx = c.getContext("2d");
  const verlauf = ctx.createRadialGradient(groesse / 2, groesse / 2, 0, groesse / 2, groesse / 2, groesse / 2);
  verlauf.addColorStop(0, "rgba(0,0,0,0.95)");
  verlauf.addColorStop(0.45, "rgba(0,0,0,0.45)");
  verlauf.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = verlauf;
  ctx.fillRect(0, 0, groesse, groesse);
  const textur = new THREE.CanvasTexture(c);
  textur.colorSpace = THREE.SRGBColorSpace;
  return textur;
}
