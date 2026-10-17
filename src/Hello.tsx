import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const Hello: React.FC<{title: string; subtitle: string}> = ({title, subtitle}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const scale = spring({frame, fps, config: {damping: 12}});
  const subOpacity = interpolate(frame, [30, 60], [0, 1], {extrapolateRight: 'clamp'});
  const subY = interpolate(frame, [30, 60], [40, 0], {extrapolateRight: 'clamp'});
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  const hue = interpolate(frame, [0, durationInFrames], [220, 300]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, hsl(${hue},70%,25%), hsl(${hue + 40},70%,12%))`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
        color: 'white',
        opacity: fadeOut,
      }}
    >
      <h1 style={{fontSize: 130, margin: 0, transform: `scale(${scale})`}}>{title}</h1>
      <p style={{fontSize: 56, opacity: subOpacity, transform: `translateY(${subY}px)`}}>
        {subtitle}
      </p>
    </AbsoluteFill>
  );
};
