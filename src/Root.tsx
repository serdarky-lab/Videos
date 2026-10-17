import {Composition} from 'remotion';
import {Hello} from './Hello';

// 9:16 Hochformat für TikTok / Reels / Shorts
export const Root: React.FC = () => {
  return (
    <Composition
      id="Hello"
      component={Hello}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{title: 'Hallo Remotion', subtitle: 'Video per Code'}}
    />
  );
};
