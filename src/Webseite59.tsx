import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

const BG = 'linear-gradient(170deg, #0b1020 0%, #1a1146 100%)';
const ACCENT = '#22e3a0';
const WARN = '#ff5470';
const FONT = 'Helvetica, Arial, sans-serif';

const useIn = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping}});
};

const Fade: React.FC<{children: React.ReactNode; duration: number}> = ({children, duration}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [duration - 8, duration], [1, 0], {extrapolateLeft: 'clamp'});
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

const Center: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill
    style={{justifyContent: 'center', alignItems: 'center', padding: 70, fontFamily: FONT, color: 'white', textAlign: 'center'}}
  >
    {children}
  </AbsoluteFill>
);

// 0–2,5 s: Hook
const Hook: React.FC = () => {
  const a = useIn(0);
  const b = useIn(18);
  return (
    <Center>
      <div style={{fontSize: 96, fontWeight: 800, lineHeight: 1.1, transform: `scale(${a})`}}>
        Website selbst mit KI bauen?
      </div>
      <div style={{fontSize: 110, fontWeight: 900, color: WARN, marginTop: 50, transform: `scale(${b})`}}>
        Teurer als du denkst.
      </div>
    </Center>
  );
};

// 2,5–5,5 s: versteckte Kosten
const COSTS = ['KI-Abo: ca. 30 € / Monat', 'Domain extra', 'Hosting extra', 'Rechte & Lizenzen', 'Viele Stunden deiner Zeit'];
const Costs: React.FC = () => {
  const frame = useCurrentFrame();
  const total = useIn(70, 10);
  return (
    <Center>
      <div style={{fontSize: 64, fontWeight: 700, opacity: 0.8, marginBottom: 40}}>Was du selbst zahlst:</div>
      {COSTS.map((c, i) => {
        const s = useIn(i * 9, 16);
        return (
          <div
            key={c}
            style={{
              fontSize: 62,
              fontWeight: 700,
              margin: '14px 0',
              padding: '22px 40px',
              borderRadius: 24,
              background: 'rgba(255,84,112,0.15)',
              border: `3px solid ${WARN}`,
              opacity: s,
              transform: `translateX(${(1 - s) * 200}px)`,
            }}
          >
            ✗ {c}
          </div>
        );
      })}
      <div style={{fontSize: 80, fontWeight: 900, color: WARN, marginTop: 40, transform: `scale(${total})`}}>
        …und es wird mehr!
      </div>
    </Center>
  );
};

// 5,5–8,5 s: Angebot
const ITEMS = ['Erstellung', 'Domain', 'Hosting', 'Monatliche Wartung', '30 Min. Änderungen inklusive'];
const Offer: React.FC = () => {
  const price = useIn(0, 9);
  return (
    <Center>
      <div style={{fontSize: 60, fontWeight: 700, opacity: 0.85}}>Wir machen das für dich:</div>
      <div style={{fontSize: 260, fontWeight: 900, color: ACCENT, lineHeight: 1, transform: `scale(${price})`}}>
        59 €
      </div>
      <div style={{fontSize: 60, fontWeight: 700, marginBottom: 40}}>pro Monat – Pauschale</div>
      {ITEMS.map((t, i) => {
        const s = useIn(14 + i * 7, 16);
        return (
          <div key={t} style={{fontSize: 56, fontWeight: 700, margin: '10px 0', opacity: s, transform: `translateY(${(1 - s) * 40}px)`}}>
            <span style={{color: ACCENT}}>✓</span> {t}
          </div>
        );
      })}
    </Center>
  );
};

// 8,5–10 s: Call to Action
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useIn(0);
  const pulse = 1 + 0.04 * Math.sin(frame / 3);
  return (
    <Center>
      <div style={{fontSize: 84, fontWeight: 800, lineHeight: 1.15, transform: `scale(${a})`}}>
        Professionell statt selbst gebastelt.
      </div>
      <div
        style={{
          marginTop: 70,
          fontSize: 86,
          fontWeight: 900,
          color: '#0b1020',
          background: ACCENT,
          padding: '34px 70px',
          borderRadius: 999,
          transform: `scale(${a * pulse})`,
        }}
      >
        Jetzt anfragen
      </div>
    </Center>
  );
};

export const Webseite59: React.FC = () => (
  <AbsoluteFill style={{background: BG}}>
    <Sequence from={0} durationInFrames={75}>
      <Fade duration={75}><Hook /></Fade>
    </Sequence>
    <Sequence from={75} durationInFrames={90}>
      <Fade duration={90}><Costs /></Fade>
    </Sequence>
    <Sequence from={165} durationInFrames={90}>
      <Fade duration={90}><Offer /></Fade>
    </Sequence>
    <Sequence from={255} durationInFrames={45}>
      <Cta />
    </Sequence>
  </AbsoluteFill>
);
