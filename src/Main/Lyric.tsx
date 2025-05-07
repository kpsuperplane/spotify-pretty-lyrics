import { useEffect, useRef, useState } from "react";
import { Song } from ".";

function ease(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function smoothScroll(y: number) {
  const startingY = window.scrollY;
  const diff = y - startingY;
  const duration = 1000;
  let start: number | null = null;

  // Bootstrap our animation - it will get called right before next frame shall be rendered.
  window.requestAnimationFrame(function step(timestamp) {
    if (start == null) start = timestamp;
    // Elapsed milliseconds since start of scrolling.
    var time = timestamp - start;
    // Get percent of completion in range [0, 1].
    var percent = ease(Math.min(time / duration, 1));

    window.scrollTo(0, startingY + diff * percent);

    // Proceed with animation as long as we wanted it to.
    if (time < duration) {
      window.requestAnimationFrame(step);
    }
  });
}

export type Lyric = { text: string; start: number; end: number };

export default function Lyric({ lyric, song }: { lyric: Lyric; song: Song }) {
  const songTime = new Date().getTime() - song.updatedAt + song.progressMs;
  const [isActive, setIsActive] = useState(
    lyric.start <= songTime && songTime <= lyric.end
  );
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isActive && songTime < lyric.start) {
      const timeout = setTimeout(() => {
        setIsActive(true);
      }, Math.max(0, lyric.start - songTime));
      return () => clearTimeout(timeout);
    } else if (isActive) {
      const timeout = setTimeout(
        () => setIsActive(false),
        Math.max(0, lyric.end - songTime)
      );
      return () => clearTimeout(timeout);
    }
  }, [songTime]);

  useEffect(() => {
    if (isActive && ref.current != null) {
      const { top, height } = ref.current?.getBoundingClientRect();
      smoothScroll(
        Math.min(
          document.documentElement.scrollHeight - window.innerHeight,
          Math.max(
            0,
            top + window.scrollY + height / 2 - window.innerHeight / 2
          )
        )
      );
    }
  }, [isActive]);
  return (
    <div
      className={`lyric${isActive ? " active" : ""}`}
      style={
        { "--duration": `${lyric.end - lyric.start}ms` } as React.CSSProperties
      }
      ref={ref}
    >
      <div className="background">{lyric.text}</div>
      <div
        className="highlight"
        style={
          {
            "--duration": `${lyric.end - lyric.start}ms`,
          } as React.CSSProperties
        }
      >
        {lyric.text}
      </div>
    </div>
  );
}
