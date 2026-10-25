import {
  AbsoluteFill,
  Freeze,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';

// Recruiting-Story 9:16 aus zwei Drehs (C0341 + C0342), Takes in public/recruiting/
const FPS = 30;
const C = {
  ink: '#16120f',
  cream: '#f6efe6',
  red: '#ff4d3d',
  green: '#2fd27a',
  yellow: '#ffd23f',
  glass: 'rgba(22,18,15,0.62)',
};
const FONT = 'Inter, Helvetica, Arial, sans-serif';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Szenen: Quelle wurde bei srcStart (Sekunden im Original) angeschnitten
const SCENES = {
  hook: {from: 0, dur: 258, src: 's1-hook.mp4', srcStart: 0},
  pitch: {from: 258, dur: 155, src: 's2-pitch.mp4', srcStart: 9.15},
  cta: {from: 413, dur: 87, src: 's3-cta.mp4', srcStart: 34.5},
  end: {from: 500, dur: 75},
} as const;
export const RECRUITING_DURATION = SCENES.end.from + SCENES.end.dur;

type Scene = keyof Omit<typeof SCENES, 'end'>;
// Original-Zeitstempel -> Frame in der fertigen Timeline
const at = (scene: Scene, srcSec: number) => SCENES[scene].from + Math.round((srcSec - SCENES[scene].srcStart) * FPS);

// Wort-Timings aus Whisper (large-v3), Text korrigiert
type Word = [Scene, number, number, string];
const WORDS: Word[] = [
  ['hook', 0.0, 0.34, 'Möchtest'], ['hook', 0.34, 1.28, 'ständig'], ['hook', 1.28, 1.96, 'fertig'], ['hook', 1.96, 2.46, 'gemacht'],
  ['hook', 2.46, 2.82, 'werden,'], ['hook', 2.82, 3.0, 'einen'], ['hook', 3.0, 3.78, 'Knebelvertrag'], ['hook', 3.78, 4.2, 'bekommen'],
  ['hook', 4.2, 4.68, 'und'], ['hook', 4.68, 5.0, 'unter'], ['hook', 5.0, 5.64, 'fünfstellig'], ['hook', 5.64, 6.08, 'verdienen?'],
  ['hook', 6.12, 6.88, 'Dann'], ['hook', 6.88, 7.14, 'solltest'], ['hook', 7.14, 7.24, 'du'], ['hook', 7.24, 7.38, 'dich'],
  ['hook', 7.38, 7.6, 'NICHT'], ['hook', 7.6, 7.8, 'bei'], ['hook', 7.8, 7.94, 'uns'], ['hook', 7.94, 8.6, 'bewerben.'],
  ['pitch', 10.06, 10.54, 'Und'], ['pitch', 10.54, 10.68, 'du'], ['pitch', 10.68, 11.02, 'verdienst'], ['pitch', 11.02, 11.14, 'noch'],
  ['pitch', 11.14, 11.32, 'unter'], ['pitch', 11.32, 11.92, 'fünfstellig?'], ['pitch', 11.92, 12.16, 'Wir'], ['pitch', 12.16, 12.4, 'haben'],
  ['pitch', 12.4, 12.54, 'ein'], ['pitch', 12.54, 12.76, 'geiles'], ['pitch', 12.76, 13.1, 'Team,'], ['pitch', 13.14, 13.4, 'wir'],
  ['pitch', 13.4, 13.58, 'haben'], ['pitch', 13.58, 13.72, 'ein'], ['pitch', 13.72, 13.86, 'geiles'], ['pitch', 13.86, 14.32, 'Produkt'],
  ['cta', 34.56, 34.94, 'und'], ['cta', 34.94, 35.08, 'du'], ['cta', 35.08, 35.26, 'hast'], ['cta', 35.26, 35.4, 'das'],
  ['cta', 35.4, 35.7, 'Verkaufen'], ['cta', 35.7, 35.84, 'im'], ['cta', 35.84, 36.1, 'Blut?'], ['cta', 36.1, 36.52, 'Dann'],
  ['cta', 36.52, 36.9, 'bewirb'], ['cta', 36.9, 37.4, 'dich!'],
];

// Wörter zu Untertitel-Seiten mit max. 3 Wörtern, Umbruch nach Satzzeichen
type Page = {start: number; end: number; words: {start: number; text: string}[]};
const PAGES: Page[] = (() => {
  const pages: Page[] = [];
  let cur: Page | null = null;
  for (const [scene, s, e, text] of WORDS) {
    const w = {start: at(scene, s), text};
    if (!cur) cur = {start: w.start, end: at(scene, e), words: []};
    cur.words.push(w);
    cur.end = at(scene, e);
    if (cur.words.length === 3 || /[,.?!]$/.test(text)) {
      pages.push(cur);
      cur = null;
    }
  }
  if (cur) pages.push(cur);
  // Seite bleibt stehen bis zur nächsten (max. 0,5 s Lücke)
  return pages.map((p, i) => ({...p, end: Math.min(pages[i + 1]?.start ?? p.end + 15, p.end + 15)}));
})();

// Bildausschnitt: Kopf-/Körpermitte in Original-Pixeln (Quelle 1024 breit), Zoom pro Frame
type Cam = {x: [number[], number[]]; zoom: [number[], number[]]};
const CAMS: Record<Scene, Cam> = {
  hook: {x: [[0, 120, 258], [495, 530, 550]], zoom: [[0, 180, 184, 258], [1.0, 1.06, 1.14, 1.18]]},
  pitch: {x: [[0, 55, 130, 155], [530, 505, 575, 580]], zoom: [[0, 8, 110, 113, 155], [1.12, 1.0, 1.02, 1.12, 1.14]]},
  cta: {x: [[0, 10, 60, 87], [590, 585, 500, 495]], zoom: [[0, 10, 87], [1.1, 1.0, 1.05]]},
};

const Footage: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {x, zoom} = CAMS[scene];
  const k = 1920 / 576;
  const cx = interpolate(frame, x[0], x[1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const z = interpolate(frame, zoom[0], zoom[1], {...clamp, easing: Easing.out(Easing.cubic)});
  const left = Math.min(0, Math.max(1080 - 1024 * k, 540 - cx * k));
  return (
    <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '50% 30%'}}>
      <OffthreadVideo src={staticFile(`recruiting/${SCENES[scene].src}`)} style={{position: 'absolute', height: 1920, width: 1024 * k, left, top: 0, maxWidth: 'none'}} />
    </AbsoluteFill>
  );
};

// Farb-Look: leicht warm, Vignette oben/unten für Lesbarkeit
const Grade: React.FC = () => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55) 100%)', boxShadow: 'inset 0 0 220px rgba(40,20,0,.35)'}} />
);

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const page = PAGES.find((p) => frame >= p.start && frame < p.end);
  if (!page || frame >= SCENES.end.from) return null;
  const pop = spring({frame: frame - page.start, fps, config: {damping: 13, stiffness: 220}});
  return (
    <div style={{position: 'absolute', top: 1170, left: 70, right: 70, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 18px', transform: `scale(${0.85 + pop * 0.15})`, opacity: pop}}>
      {page.words.map((w, i) => {
        const next = page.words[i + 1]?.start ?? page.end;
        const active = frame >= w.start && frame < next;
        const shout = w.text === 'NICHT';
        return (
          <span key={i} style={{fontFamily: FONT, fontWeight: 900, fontSize: 86, lineHeight: 1.12, letterSpacing: -1.5, color: active ? C.ink : shout ? C.red : '#fff', background: active ? (shout ? C.red : C.yellow) : 'transparent', padding: '2px 16px', borderRadius: 18, textShadow: active ? 'none' : '0 4px 0 rgba(0,0,0,.55), 0 0 24px rgba(0,0,0,.5)', transform: `rotate(${active ? -2 : 0}deg) scale(${active ? 1.06 : 1})`}}>
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

const Chip: React.FC<{at: number; icon: string; label: string; color: string; strike?: number}> = ({at: start, icon, label, color, strike}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - start, fps, config: {damping: 12, stiffness: 180}});
  const line = strike === undefined ? 0 : interpolate(frame, [strike, strike + 8], [0, 1], clamp);
  if (frame < start) return null;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 20, padding: '18px 34px 18px 20px', borderRadius: 999, background: C.glass, backdropFilter: 'blur(18px)', border: '2px solid rgba(255,255,255,.18)', boxShadow: '0 18px 50px rgba(0,0,0,.35)', transform: `translateX(${(1 - s) * -260}px) scale(${0.6 + s * 0.4})`, opacity: s, position: 'relative', alignSelf: 'flex-start'}}>
      <div style={{width: 62, height: 62, borderRadius: 999, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 900, color: '#fff', fontFamily: FONT}}>{icon}</div>
      <span style={{fontFamily: FONT, fontWeight: 800, fontSize: 48, color: '#fff', letterSpacing: -0.5}}>{label}</span>
      <div style={{position: 'absolute', left: 100, top: '50%', height: 6, width: `calc(${line * 100}% - 120px)`, background: C.red, borderRadius: 3}} />
    </div>
  );
};

const ChipStack: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{position: 'absolute', top: 300, left: 60, display: 'flex', flexDirection: 'column', gap: 22}}>{children}</div>
);

const Stamp: React.FC<{at: number; text: string}> = ({at: start, text}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - start, fps, config: {damping: 9, stiffness: 260}});
  if (frame < start) return null;
  return (
    <div style={{position: 'absolute', top: 760, width: '100%', display: 'flex', justifyContent: 'center'}}>
      <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 104, letterSpacing: -2, color: C.red, border: `10px solid ${C.red}`, borderRadius: 26, padding: '10px 40px', background: 'rgba(255,255,255,.88)', transform: `rotate(-7deg) scale(${2.2 - s * 1.2})`, opacity: Math.min(1, s * 1.5)}}>{text}</div>
    </div>
  );
};

const Kicker: React.FC = () => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [4, 16, SCENES.end.from - 6, SCENES.end.from], [0, 1, 1, 0], clamp);
  const pulse = 0.5 + 0.5 * Math.sin(frame / 6);
  return (
    <div style={{position: 'absolute', top: 210, left: 60, display: 'flex', alignItems: 'center', gap: 14, opacity: o, fontFamily: FONT, fontWeight: 800, fontSize: 34, letterSpacing: 4, color: '#fff'}}>
      <div style={{width: 18, height: 18, borderRadius: 9, background: C.red, boxShadow: `0 0 ${10 + pulse * 18}px ${C.red}`}} />
      WIR STELLEN EIN · VERTRIEB
    </div>
  );
};

// Schneller Weiß-Blitz + Zoom-Wisch auf Schnitten
const Flash: React.FC<{at: number}> = ({at: cut}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [cut - 3, cut, cut + 6], [0, 0.85, 0], clamp);
  return <AbsoluteFill style={{background: C.cream, opacity: o, mixBlendMode: 'screen'}} />;
};

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bg = interpolate(frame, [0, 12], [0, 1], clamp);
  const a = spring({frame: frame - 4, fps, config: {damping: 14}});
  const b = spring({frame: frame - 12, fps, config: {damping: 12}});
  const c = spring({frame: frame - 22, fps, config: {damping: 10}});
  const pulse = 1 + 0.04 * Math.sin((frame - 22) / 4);
  const arrow = Math.sin(frame / 5) * 14;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: `blur(${bg * 22}px) brightness(${1 - bg * 0.45})`, transform: `scale(${1.05 + bg * 0.1})`}}>
        <Freeze frame={SCENES.cta.dur - 1}>
          <Footage scene="cta" />
        </Freeze>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', fontFamily: FONT, color: '#fff', textAlign: 'center', gap: 34}}>
        <div style={{fontWeight: 800, fontSize: 40, letterSpacing: 8, color: C.yellow, opacity: a, transform: `translateY(${(1 - a) * 30}px)`}}>WIR STELLEN EIN</div>
        <div style={{fontWeight: 900, fontSize: 128, lineHeight: 1, letterSpacing: -4, opacity: b, transform: `translateY(${(1 - b) * 60}px)`}}>
          Vertrieb<br />im Blut?
        </div>
        <div style={{marginTop: 30, fontWeight: 900, fontSize: 60, color: C.ink, background: C.yellow, padding: '30px 70px', borderRadius: 999, boxShadow: `0 0 70px ${C.yellow}88`, transform: `scale(${c * pulse})`}}>Jetzt bewerben →</div>
        <div style={{marginTop: 70, opacity: c, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transform: `translateY(${arrow}px)`}}>
          <div style={{fontSize: 70, lineHeight: 0.6}}>⌃</div>
          <div style={{fontWeight: 700, fontSize: 38, letterSpacing: 2}}>Link in Bio</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Recruiting: React.FC = () => (
  <AbsoluteFill style={{background: C.ink}}>
    {(['hook', 'pitch', 'cta'] as const).map((s) => (
      <Sequence key={s} from={SCENES[s].from} durationInFrames={SCENES[s].dur} name={s}>
        <Footage scene={s} />
      </Sequence>
    ))}
    <Grade />
    <Sequence from={SCENES.end.from} durationInFrames={SCENES.end.dur} name="Endcard">
      <EndCard />
    </Sequence>

    <Kicker />
    <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.dur} name="Hook-Overlays">
      <ChipStack>
        <Chip at={at('hook', 1.28)} icon="✕" label="Ständig fertig gemacht" color={C.red} />
        <Chip at={at('hook', 3.0)} icon="✕" label="Knebelvertrag" color={C.red} />
        <Chip at={at('hook', 5.0)} icon="✕" label="Unter 5-stellig" color={C.red} />
      </ChipStack>
      <Stamp at={at('hook', 7.38)} text="NICHT BEWERBEN" />
    </Sequence>
    <Sequence from={SCENES.pitch.from} durationInFrames={SCENES.pitch.dur + SCENES.cta.dur} name="Pitch-Overlays">
      <ChipStack>
        <Chip at={at('pitch', 11.32) - SCENES.pitch.from} icon="?" label="Unter 5-stellig?" color={C.red} strike={at('pitch', 12.76) - SCENES.pitch.from} />
        <Chip at={at('pitch', 12.76) - SCENES.pitch.from} icon="✓" label="Geiles Team" color={C.green} />
        <Chip at={at('pitch', 13.86) - SCENES.pitch.from} icon="✓" label="Geiles Produkt" color={C.green} />
        <Chip at={at('cta', 35.84) - SCENES.pitch.from} icon="✓" label="Verkaufen im Blut" color={C.green} />
      </ChipStack>
    </Sequence>

    <Captions />
    <Flash at={SCENES.pitch.from} />
    <Flash at={SCENES.cta.from} />
    <Flash at={SCENES.end.from} />
  </AbsoluteFill>
);
