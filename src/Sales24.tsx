import {createContext, useContext} from 'react';
import {AbsoluteFill, Sequence, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';

const C = {bg: '#070b1a', card: 'rgba(255,255,255,0.07)', line: 'rgba(255,255,255,0.14)', ok: '#38d0ff', bad: '#9db8ff', blue: '#2f6bff', violet: '#1d3fd8', text: '#f4f6ff'};
const FONT = 'Helvetica, Arial, sans-serif';

const useSpring = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping}});
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Offset = createContext(0);
// Globale Zeit, damit der Hintergrund über Szenenwechsel hinweg durchläuft
const useGlobalFrame = () => useCurrentFrame() + useContext(Offset);

const PARTICLES = Array.from({length: 90}, (_, i) => ({
  x: random(`x${i}`) * 1080,
  y0: random(`y${i}`) * 1920,
  size: 4 + random(`s${i}`) * 12,
  speed: 0.6 + random(`v${i}`) * 2.4,
  drift: 20 + random(`d${i}`) * 60,
  phase: random(`p${i}`) * 6.28,
  hue: random(`h${i}`),
}));

const Particles: React.FC = () => {
  const t = useGlobalFrame();
  return (
    <>
      {PARTICLES.map((p, i) => {
        const y = (((p.y0 - t * p.speed) % 2000) + 2000) % 2000 - 40;
        const x = p.x + Math.sin(t / 40 + p.phase) * p.drift;
        const o = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t / 12 + p.phase));
        const col = p.hue > 0.5 ? '#8fe6ff' : '#5b8cff';
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: p.size, height: p.size, borderRadius: '50%', background: col, opacity: o, boxShadow: `0 0 ${p.size * 3}px ${col}`}} />;
      })}
    </>
  );
};

const GridFloor: React.FC = () => {
  const t = useGlobalFrame();
  const off = (t * 2) % 120;
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 0.35, backgroundImage: `linear-gradient(${C.line} 2px, transparent 2px), linear-gradient(90deg, ${C.line} 2px, transparent 2px)`, backgroundSize: '120px 120px', backgroundPosition: `${off}px ${off}px`, WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 10%, transparent 75%)', maskImage: 'radial-gradient(circle at 50% 50%, black 10%, transparent 75%)'}} />
  );
};

const Rings: React.FC = () => {
  const t = useGlobalFrame();
  return (
    <>
      {[0, 1, 2].map((i) => {
        const k = ((t + i * 70) % 210) / 210;
        return <div key={i} style={{position: 'absolute', left: '50%', top: '55%', width: 200 + k * 1500, height: 200 + k * 1500, borderRadius: '50%', border: `3px solid ${C.ok}`, opacity: (1 - k) * 0.25, transform: 'translate(-50%,-50%)'}} />;
      })}
    </>
  );
};

const Sweep: React.FC = () => {
  const t = useGlobalFrame();
  const x = interpolate((t % 160) / 160, [0, 1], [-600, 1700]);
  return <div style={{position: 'absolute', top: -200, left: x, width: 260, height: 2400, background: 'linear-gradient(90deg, transparent, rgba(143,230,255,.18), transparent)', transform: 'rotate(20deg)'}} />;
};

const Glow: React.FC<{color: string; x: string; y: string; size?: number; phase?: number}> = ({color, x, y, size = 900, phase = 0}) => {
  const t = useGlobalFrame();
  const dx = Math.sin(t / 50 + phase) * 140;
  const dy = Math.cos(t / 60 + phase) * 140;
  const sc = 1 + 0.12 * Math.sin(t / 35 + phase);
  return <div style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%', background: color, filter: 'blur(180px)', opacity: 0.38, transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${sc})`}} />;
};

const Scene: React.FC<{children: React.ReactNode; glow?: string}> = ({children, glow = C.blue}) => (
  <AbsoluteFill style={{background: C.bg, fontFamily: FONT, color: C.text, overflow: 'hidden'}}>
    <Glow color={glow} x="20%" y="15%" />
    <Glow color={C.violet} x="85%" y="85%" phase={2} />
    <Glow color={C.ok} x="75%" y="35%" size={600} phase={4} />
    <GridFloor />
    <Rings />
    <Sweep />
    <Particles />
    {children}
  </AbsoluteFill>
);

const Btn: React.FC<{label: string; primary?: boolean; scale?: number; size?: number}> = ({label, primary, scale = 1, size = 44}) => (
  <div style={{display: 'inline-block', fontSize: size, fontWeight: 800, padding: '22px 50px', borderRadius: 999, transform: `scale(${scale})`, color: primary ? '#04112e' : C.text, background: primary ? `linear-gradient(90deg, ${C.ok}, #8fe6ff)` : C.card, border: primary ? 'none' : `2px solid ${C.line}`, boxShadow: primary ? `0 0 60px ${C.ok}66` : 'none'}}>{label}</div>
);

const Browser: React.FC<{children: React.ReactNode; url?: string; height?: number}> = ({children, url = 'deine-firma.de', height = 1000}) => (
  <div style={{width: 940, height, borderRadius: 36, background: '#0e1430', border: `2px solid ${C.line}`, boxShadow: '0 40px 120px rgba(0,0,0,.6)', overflow: 'hidden'}}>
    <div style={{height: 84, display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', background: 'rgba(255,255,255,.06)'}}>
      {['#9db8ff', '#5b8cff', '#38d0ff'].map((c) => <div key={c} style={{width: 22, height: 22, borderRadius: 11, background: c}} />)}
      <div style={{marginLeft: 20, flex: 1, height: 48, borderRadius: 24, background: 'rgba(255,255,255,.08)', fontSize: 28, display: 'flex', alignItems: 'center', padding: '0 24px', opacity: 0.8}}>🔒 {url}</div>
    </div>
    <div style={{position: 'relative', height: height - 84, overflow: 'hidden'}}>{children}</div>
  </div>
);

// 1 Hook
const Hook: React.FC = () => {
  const a = useSpring(0);
  const b = useSpring(20, 10);
  return (
    <Scene>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 70}}>
        <div style={{fontSize: 56, fontWeight: 700, opacity: 0.7, transform: `scale(${a})`}}>Website selbst mit KI bauen?</div>
        <div style={{fontSize: 150, fontWeight: 900, lineHeight: 1, marginTop: 30, transform: `scale(${b})`, background: `linear-gradient(90deg, ${C.bad}, #e6efff)`, WebkitBackgroundClip: 'text', color: 'transparent'}}>
          Das kostet dich mehr!
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// 2 DIY: Timer + wachsende Kosten
const Diy: React.FC = () => {
  const frame = useCurrentFrame();
  const hours = interpolate(frame, [10, 150], [0, 40], clamp);
  const h = Math.floor(hours);
  const m = Math.floor((hours % 1) * 60);
  const chips = ['KI-Abo ca. 30 €/Monat', 'Domain extra', 'Hosting extra'];
  const warn = useSpring(110, 9);
  return (
    <Scene glow={C.bad}>
      <AbsoluteFill style={{alignItems: 'center', padding: '120px 60px', textAlign: 'center'}}>
        <div style={{fontSize: 52, fontWeight: 700, opacity: 0.7}}>Deine Zeit läuft…</div>
        <div style={{marginTop: 20, fontSize: 250, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: hours > 25 ? C.bad : C.text}}>
          {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
        </div>
        <div style={{fontSize: 60, fontWeight: 800, marginTop: -20}}>Stunden investiert</div>
        <div style={{width: 860, height: 26, borderRadius: 13, background: C.card, marginTop: 50, overflow: 'hidden'}}>
          <div style={{width: `${(hours / 40) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.ok}, ${C.bad})`}} />
        </div>
        <div style={{marginTop: 60, display: 'flex', flexDirection: 'column', gap: 18}}>
          {chips.map((c, i) => {
            const s = useSpring(40 + i * 18, 16);
            return <div key={c} style={{fontSize: 50, fontWeight: 700, padding: '20px 44px', borderRadius: 24, background: C.card, border: `2px solid ${C.bad}`, opacity: s, transform: `translateX(${(1 - s) * 300}px)`}}>＋ {c}</div>;
          })}
        </div>
        <div style={{marginTop: 50, fontSize: 56, fontWeight: 900, padding: '26px 46px', borderRadius: 28, background: `${C.bad}33`, border: `3px solid ${C.bad}`, transform: `scale(${warn})`}}>
          ⚠ Impressum? Datenschutz?<br />Noch nicht mal rechtssicher!
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// 3 Pivot
const Pivot: React.FC = () => {
  const a = useSpring(0, 8);
  return (
    <Scene glow={C.ok}>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 70}}>
        <div style={{fontSize: 90, fontWeight: 700, opacity: 0.8}}>Oder du lässt es</div>
        <div style={{fontSize: 190, fontWeight: 900, lineHeight: 1, transform: `scale(${a})`, background: `linear-gradient(90deg, ${C.ok}, #8fe6ff)`, WebkitBackgroundClip: 'text', color: 'transparent'}}>
          uns machen.
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// 4 Website-Mockup, die sich aufbaut und scrollt
const Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, [70, 190], [0, 520], clamp);
  const hero = useSpring(0, 18);
  const cards = [0, 1, 2].map((i) => useSpring(25 + i * 12, 16));
  const click = frame > 60 && frame < 75;
  const cursorX = interpolate(frame, [30, 60], [800, 470], clamp);
  const cursorY = interpolate(frame, [30, 60], [900, 560], clamp);
  return (
    <Scene>
      <AbsoluteFill style={{alignItems: 'center', paddingTop: 110}}>
        <div style={{fontSize: 48, fontWeight: 800, marginBottom: 36, opacity: 0.9}}>So sieht <span style={{color: C.ok}}>deine</span> Website aus</div>
        <Browser height={1350}>
          <div style={{transform: `translateY(${-scroll}px)`, padding: 40}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 30, fontWeight: 700}}>
              <div style={{fontSize: 38, fontWeight: 900}}>◆ DeineFirma</div>
              <div style={{display: 'flex', gap: 26, opacity: 0.8}}><span>Leistungen</span><span>Über uns</span><span>Kontakt</span></div>
            </div>
            <div style={{marginTop: 70, opacity: hero, transform: `translateY(${(1 - hero) * 40}px)`}}>
              <div style={{fontSize: 84, fontWeight: 900, lineHeight: 1.05}}>Willkommen bei<br />deinem Business.</div>
              <div style={{fontSize: 34, opacity: 0.7, marginTop: 20}}>Modern. Schnell. Mobil optimiert.</div>
              <div style={{marginTop: 40, display: 'flex', gap: 20}}>
                <Btn label="Jetzt buchen" primary size={34} scale={click ? 0.93 : 1} />
                <Btn label="Mehr erfahren" size={34} />
              </div>
            </div>
            <div style={{marginTop: 80, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20}}>
              {['⚡ Schnell', '🔒 Sicher', '📱 Mobil'].map((t, i) => (
                <div key={t} style={{padding: '40px 20px', borderRadius: 28, background: C.card, border: `2px solid ${C.line}`, fontSize: 34, fontWeight: 800, textAlign: 'center', opacity: cards[i], transform: `translateY(${(1 - cards[i]) * 60}px)`}}>{t}</div>
              ))}
            </div>
            <div style={{marginTop: 60, padding: 40, borderRadius: 32, background: `linear-gradient(135deg, ${C.blue}55, ${C.violet}55)`, border: `2px solid ${C.line}`}}>
              <div style={{fontSize: 52, fontWeight: 900}}>Schreib uns!</div>
              <div style={{marginTop: 24, height: 70, borderRadius: 16, background: 'rgba(255,255,255,.12)'}} />
              <div style={{marginTop: 16, height: 70, borderRadius: 16, background: 'rgba(255,255,255,.12)'}} />
              <div style={{marginTop: 24}}><Btn label="Absenden" primary size={32} /></div>
            </div>
          </div>
          <div style={{position: 'absolute', left: cursorX, top: cursorY, fontSize: 60, transform: click ? 'scale(.85)' : 'none'}}>🖱️</div>
        </Browser>
      </AbsoluteFill>
    </Scene>
  );
};

// 5 Vergleich: Waage / Balken + Preiskarte
const Compare: React.FC = () => {
  const frame = useCurrentFrame();
  const diy = interpolate(frame, [5, 45], [0, 1], clamp);
  const us = interpolate(frame, [45, 70], [0, 0.18], clamp);
  const card = useSpring(70, 12);
  const items = ['Erstellung', 'Domain', 'Hosting', 'Monatliche Wartung', '30 Min. Änderungen'];
  return (
    <Scene glow={C.ok}>
      <AbsoluteFill style={{alignItems: 'center', padding: '110px 60px', textAlign: 'center'}}>
        <div style={{display: 'flex', gap: 40, alignItems: 'flex-end', height: 520}}>
          <div style={{width: 380}}>
            <div style={{height: 400 * diy, borderRadius: 28, background: `linear-gradient(180deg, ${C.bad}, #3a5fd0)`}} />
            <div style={{fontSize: 38, fontWeight: 800, marginTop: 16}}>Selbst machen<br /><span style={{color: C.bad}}>40 Std. + Abo + Extras</span></div>
          </div>
          <div style={{width: 380}}>
            <div style={{height: 400 * us * 1.4, borderRadius: 28, background: `linear-gradient(180deg, ${C.ok}, #0b6fb0)`}} />
            <div style={{fontSize: 38, fontWeight: 800, marginTop: 16}}>Mit uns<br /><span style={{color: C.ok}}>59 € / Monat</span></div>
          </div>
        </div>
        <div style={{marginTop: 60, width: 900, padding: '44px 40px', borderRadius: 44, background: C.card, border: `3px solid ${C.ok}`, boxShadow: `0 0 90px ${C.ok}44`, transform: `scale(${card})`}}>
          <div style={{fontSize: 190, fontWeight: 900, lineHeight: 1, color: C.ok}}>59 €</div>
          <div style={{fontSize: 44, fontWeight: 700, opacity: 0.8, marginBottom: 24}}>pro Monat · alles inklusive</div>
          {items.map((t) => <div key={t} style={{fontSize: 44, fontWeight: 700, margin: '8px 0'}}><span style={{color: C.ok}}>✓</span> {t}</div>)}
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

// 6 CTA
const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useSpring(0);
  const pulse = 1 + 0.05 * Math.sin(frame / 3);
  return (
    <Scene glow={C.ok}>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 70}}>
        <div style={{fontSize: 96, fontWeight: 900, lineHeight: 1.1, transform: `scale(${a})`}}>Professionell statt<br />selbst gebastelt.</div>
        <div style={{marginTop: 80}}><Btn label="Jetzt anfragen →" primary size={78} scale={a * pulse} /></div>
      </AbsoluteFill>
    </Scene>
  );
};

export const Sales24: React.FC = () => (
  <AbsoluteFill>
    <Sequence from={0} durationInFrames={90}><Offset.Provider value={0}><Hook /></Offset.Provider></Sequence>
    <Sequence from={90} durationInFrames={180}><Offset.Provider value={90}><Diy /></Offset.Provider></Sequence>
    <Sequence from={270} durationInFrames={60}><Offset.Provider value={270}><Pivot /></Offset.Provider></Sequence>
    <Sequence from={330} durationInFrames={210}><Offset.Provider value={330}><Demo /></Offset.Provider></Sequence>
    <Sequence from={540} durationInFrames={120}><Offset.Provider value={540}><Compare /></Offset.Provider></Sequence>
    <Sequence from={660} durationInFrames={60}><Offset.Provider value={660}><Cta /></Offset.Provider></Sequence>
  </AbsoluteFill>
);
