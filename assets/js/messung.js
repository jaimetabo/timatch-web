/* Reichweitenmessung — bewusst ohne Matomo-Skript, ohne Cookies, ohne Bibliothek.
 *
 * Wir zählen mit unserem eigenen Matomo (jaimetaboada.com/matomo, Webspace bei Strato in Berlin),
 * wie oft welche Seite aufgerufen wird und welche Links nach draußen geklickt werden (App Store,
 * Timatch Web). Statt Matomos großem `matomo.js` schicken diese paar Zeilen die Zählung direkt an
 * Matomos Tracking-Schnittstelle. So läuft auf timatch.de weiterhin nur eigener Code (CSP
 * `script-src 'self'`), und wir wissen genau, was rausgeht:
 *
 *   - die Adresse der Seite OHNE Parameter und Anker (nur Kampagnen-Parameter mtm_/utm_ bleiben),
 *   - der Seitentitel,
 *   - woher man kam (nur Herkunft und Pfad, ohne Parameter),
 *   - beim Klick auf einen Link nach draußen dessen Ziel (ebenfalls ohne Parameter).
 *
 * Nichts wird auf dem Gerät gespeichert oder ausgelesen (keine Bildschirmgröße, keine Plugins,
 * keine Kennung). Matomo kürzt die IP-Adresse um zwei Bytes und setzt für diese Website nie
 * Cookies. Wer „Do Not Track“ oder „Global Privacy Control“ eingeschaltet hat, wird gar nicht
 * gezählt; wer auf der Datenschutzseite widerspricht, ebenfalls nicht mehr (dann — und nur dann —
 * merkt sich der Browser genau diesen Wunsch).
 */

(function () {
  "use strict";

  var ZIEL = "https://jaimetaboada.com/matomo/matomo.php";
  var SEITE = 2;                      // Matomo-Website „Timatch · timatch.de“
  var WUNSCH = "timatch-messung";     // localStorage: "aus" = Widerspruch

  function widersprochen() {
    try { return localStorage.getItem(WUNSCH) === "aus"; } catch (e) { return false; }
  }
  function signalAus() {
    return navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true;
  }
  function aus() { return widersprochen() || signalAus(); }

  // Adresse ohne Parameter und Anker; nur Kampagnen-Angaben (z. B. ?mtm_campaign=app-store) bleiben.
  function sauber(adresse, kampagnenBehalten) {
    try {
      var u = new URL(adresse, location.href);
      var behalten = new URLSearchParams();
      if (kampagnenBehalten) {
        u.searchParams.forEach(function (wert, name) {
          if (/^(mtm_|utm_|pk_)/i.test(name)) behalten.append(name, wert.slice(0, 100));
        });
      }
      var q = behalten.toString();
      return u.origin + u.pathname + (q ? "?" + q : "");
    } catch (e) { return ""; }
  }

  function senden(angaben) {
    if (aus()) return;
    angaben.idsite = SEITE;
    angaben.rec = 1;
    angaben.apiv = 1;
    angaben.send_image = 0;
    angaben.rand = Math.random().toString(36).slice(2, 10);
    var adresse = ZIEL + "?" + new URLSearchParams(angaben).toString();
    try {
      // keepalive: der Klick auf einen Link darf die Zählung nicht abbrechen.
      fetch(adresse, { method: "POST", mode: "no-cors", credentials: "omit", keepalive: true, referrerPolicy: "no-referrer" })
        .catch(function () {});
    } catch (e) { /* alter Browser oder Werbeblocker: dann eben nicht */ }
  }

  var hier = sauber(location.href, true);

  // ------------------------------------------------------------ Seitenaufruf
  var herkunft = document.referrer ? sauber(document.referrer, false) : "";
  senden({ url: hier, action_name: document.title.slice(0, 150), urlref: herkunft });

  // ------------------------------------------------------------ Links nach draußen
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || (a.protocol !== "https:" && a.protocol !== "http:")) return;   // mailto: & Co. nicht
    if (a.host === location.host) return;
    senden({ url: hier, link: sauber(a.href, false) });
  }, true);

  // ------------------------------------------------------------ Widerspruch (Datenschutzseite)
  var knopf = document.querySelector("[data-messung-schalter]");
  var stand = document.querySelector("[data-messung-stand]");
  if (knopf && stand) {
    var de = (document.documentElement.lang || "de").slice(0, 2) !== "en";
    var zeige = function () {
      var w = widersprochen();
      if (signalAus() && !w) {
        stand.textContent = de
          ? "Dein Browser sendet „Do Not Track“ bzw. „Global Privacy Control“ — du wirst schon jetzt nicht gezählt."
          : "Your browser sends “Do Not Track” or “Global Privacy Control”, so you are already not counted.";
      } else {
        stand.textContent = w
          ? (de ? "Ausgeschaltet: Dieser Browser wird auf timatch.de nicht gezählt." : "Off: this browser is not counted on timatch.de.")
          : (de ? "Eingeschaltet: Seitenaufrufe dieses Browsers werden anonym gezählt." : "On: page views from this browser are counted anonymously.");
      }
      knopf.textContent = w
        ? (de ? "Zählung wieder erlauben" : "Allow counting again")
        : (de ? "Nicht mehr zählen" : "Stop counting me");
    };
    knopf.hidden = false;
    knopf.addEventListener("click", function () {
      try {
        if (widersprochen()) localStorage.removeItem(WUNSCH); else localStorage.setItem(WUNSCH, "aus");
      } catch (e) { /* privates Fenster: dort zählt ohnehin nichts dauerhaft */ }
      zeige();
    });
    zeige();
  }
})();
