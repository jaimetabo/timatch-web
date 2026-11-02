/* Kleinkram, der die Seite lebendig macht — bewusst wenig, ohne Bibliothek und ohne Netzzugriff.
 *
 * Alles hier ist Zugabe: Ohne JavaScript bleibt die Seite vollständig lesbar und bedienbar. Die
 * Abschnitte sind dann nur eben sofort da, statt sich einzublenden.
 */

(function () {
  "use strict";

  // Ohne JavaScript stehen die drei Duo-Ansichten untereinander (siehe `.ohne-js` in site.css).
  document.body.classList.remove("ohne-js");

  // ------------------------------------------------------------ Kopfleiste
  const kopf = document.querySelector(".kopfleiste");
  if (kopf) {
    const pruefe = () => kopf.classList.toggle("gescrollt", window.scrollY > 12);
    pruefe();
    window.addEventListener("scroll", pruefe, { passive: true });
  }

  const ruhigGewuenscht = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ------------------------------------------------------------ Einblenden
  const teile = document.querySelectorAll(".auftritt");
  if (ruhigGewuenscht || !("IntersectionObserver" in window)) {
    // Wer wenig Bewegung wünscht, bekommt alles sofort — und wer einen alten Browser hat auch.
    teile.forEach((el) => el.classList.add("sichtbar"));
  } else {
    const beobachter = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("sichtbar");
        beobachter.unobserve(e.target);   // einmal eingeblendet, nie wieder beobachtet
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    teile.forEach((el) => beobachter.observe(el));
  }

  // ------------------------------------------------------------ Videos
  //
  // Die Videos laufen NUR, solange sie zu sehen sind. Vier gleichzeitig dekodierte Videos sind auf
  // einem Telefon spürbar — an der Wärme und an der Laufzeit. `preload="none"` sorgt zusätzlich
  // dafür, dass ein Besucher, der nie bis zum Punktezettel scrollt, dessen Video auch nie lädt.
  const videos = document.querySelectorAll("video[data-in-sicht]");
  if (videos.length && "IntersectionObserver" in window) {
    const schauer = new IntersectionObserver((eintraege) => {
      eintraege.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          if (v.preload === "none") v.preload = "auto";
          const versuch = v.play();
          // Ein abgelehntes `play()` ist kein Fehler: Energiesparmodus und Datensparmodus dürfen
          // das. Dann bleibt das Posterbild stehen, und die Seite sieht trotzdem vollständig aus.
          if (versuch && versuch.catch) versuch.catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.25 });
    videos.forEach((v) => schauer.observe(v));
  }

  // ------------------------------------------------------------ iPhone Duo: Haltungen
  //
  // Drei Reiter (Aufgestellt · Aufgeklappt · Zugeklappt) schalten die Ansicht um — nach dem
  // WAI-ARIA-Muster für Reiter: Pfeiltasten wandern, nur der aktive Reiter ist per Tab erreichbar.
  const leiste = document.querySelector(".haltungen");
  if (leiste) {
    const reiter = Array.from(leiste.querySelectorAll('[role="tab"]'));
    const text = document.querySelector("[data-haltung-text]");
    const zeige = (aktiv, fokus) => {
      reiter.forEach((r) => {
        const an = r === aktiv;
        r.setAttribute("aria-selected", String(an));
        r.tabIndex = an ? 0 : -1;
        const feld = document.getElementById(r.getAttribute("aria-controls"));
        if (feld) {
          feld.hidden = !an;
          if (an && text && feld.dataset.text) text.textContent = feld.dataset.text;
        }
      });
      if (fokus) aktiv.focus();
    };
    reiter.forEach((r, i) => {
      r.addEventListener("click", () => zeige(r, false));
      r.addEventListener("keydown", (e) => {
        let ziel = null;
        if (e.key === "ArrowRight") ziel = reiter[(i + 1) % reiter.length];
        if (e.key === "ArrowLeft") ziel = reiter[(i - 1 + reiter.length) % reiter.length];
        if (e.key === "Home") ziel = reiter[0];
        if (e.key === "End") ziel = reiter[reiter.length - 1];
        if (ziel) { e.preventDefault(); zeige(ziel, true); }
      });
    });
  }

  // ------------------------------------------------------------ Jahreszahl
  // Damit im Impressum-Hinweis unten nicht irgendwann eine veraltete Jahreszahl steht.
  const jahr = document.querySelector("[data-jahr]");
  if (jahr) jahr.textContent = String(new Date().getFullYear());
})();
