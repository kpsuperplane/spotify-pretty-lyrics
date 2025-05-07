import { useEffect, useState } from "react";
import { Song } from ".";

export type Lyric = { text: string; start: number; end: number };

export default function Lyric({ lyric, song }: { lyric: Lyric; song: Song }) {
  const songTime = new Date().getTime() - song.updatedAt + song.progressMs;
  const [isActive, setIsActive] = useState(
    lyric.start <= songTime && songTime <= lyric.end
  );
  useEffect(() => {
    if (!isActive && songTime < lyric.start) {
      const timeout = setTimeout(
        () => setIsActive(true),
        Math.max(0, lyric.start - songTime)
      );
      return () => clearTimeout(timeout);
    } else if (isActive) {
      const timeout = setTimeout(
        () => setIsActive(false),
        Math.max(0, lyric.end - songTime)
      );
      return () => clearTimeout(timeout);
    }
  }, [songTime]);
  return (
    <div className={`lyric${isActive ? " active" : ""}`} style={{'--duration': `${lyric.end - lyric.start}ms`} as React.CSSProperties}>
      <div className="background">{lyric.text}</div>
      <div className="highlight" style={{'--duration': `${lyric.end - lyric.start}ms`} as React.CSSProperties}>{lyric.text}</div>
    </div>
  );
}
