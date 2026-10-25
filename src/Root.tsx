import {Composition} from 'remotion';
import {Hello} from './Hello';
import {Webseite59} from './Webseite59';
import {Sales24} from './Sales24';
import {Recruiting, RECRUITING_DURATION} from './Recruiting';

// 9:16 Hochformat für TikTok / Reels / Shorts
export const Root: React.FC = () => {
  return (
    <>
    <Composition
      id="Hello"
      component={Hello}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{title: 'Hallo Remotion', subtitle: 'Video per Code'}}
    />
    <Composition id="Webseite59" component={Webseite59} durationInFrames={300} fps={30} width={1080} height={1920} />
    <Composition id="Recruiting" component={Recruiting} durationInFrames={RECRUITING_DURATION} fps={30} width={1080} height={1920} />
    <Composition id="Sales24" component={Sales24} durationInFrames={750} fps={30} width={1080} height={1920} />
    </>
  );
};
