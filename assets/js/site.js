/* Kleinkram, der die Seite lebendig macht — bewusst wenig, ohne Bibliothek und ohne Netzzugriff.
 *
 * Alles hier ist Zugabe: Ohne JavaScript bleibt die Seite vollständig lesbar und bedienbar. Die
 * Abschnitte sind dann nur eben sofort da, statt sich einzublenden.
 */

(function () {
  "use strict";

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

  // ------------------------------------------------------------ Jahreszahl
  // Damit im Impressum-Hinweis unten nicht irgendwann eine veraltete Jahreszahl steht.
  const jahr = document.querySelector("[data-jahr]");
  if (jahr) jahr.textContent = String(new Date().getFullYear());
})();
