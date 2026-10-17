# Videos

Remotion-Projekt (Videos als React-Code), Format 9:16 (1080×1920) für TikTok/Reels/Shorts.

```bash
npm install
npm run studio   # Vorschau im Browser
npm run render   # -> out/hello.mp4
```

Neue Animationen: Komponente in `src/` anlegen und in `src/Root.tsx` als `<Composition>` registrieren.
Klassischer Schnitt (trimmen, zusammenfügen) geht mit `ffmpeg`, z. B. `ffmpeg -i in.mp4 -ss 5 -t 10 -c copy out.mp4`.
