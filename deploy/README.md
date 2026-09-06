# deploy/ — was nicht auf GitHub Pages liegt

## `app-timatch.htaccess`

Gehört auf den **Strato-Webspace** nach `htdocs/app-timatch/.htaccess`. Diese Datei liegt hier
nur, damit sie versioniert ist — GitHub Pages liefert sie nicht aus und wertet sie auch nicht aus.

Sie beantwortet `app.timatch.de` mit einer dauerhaften Weiterleitung auf `timatch.de`. Bis zum
6. September 2026 machte das ein eigenes Repository (`timatch-website`) mit fünf
Platzhalterseiten auf GitHub Pages; für eine reine Weiterleitung war das ein Repository zu viel.

Einspielen:

```bash
scp deploy/app-timatch.htaccess strato:app-timatch/.htaccess
```

Prüfen:

```bash
for p in / /hilfe.html /support.html /gibtsnicht; do
  curl -sIo /dev/null -w "%{http_code} -> %{redirect_url}\n" "https://app.timatch.de$p"
done
```

Erwartet: viermal `301`, die ersten drei auf ihre jeweiligen Nachfolger, der letzte auf die
Startseite.
