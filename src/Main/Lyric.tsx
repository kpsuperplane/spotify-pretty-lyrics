import { useEffect, useRef, useState } from "react";
import { Song } from ".";
import { extractLines } from "../lib/extractLines";

function ease(x: number): number {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function smoothScroll(y: number, duration: number) {
  const startingY = window.scrollY;
  const diff = y - startingY;
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
        ),
        Math.min(1000, (lyric.end - lyric.start) / 2)
      );
    }
  }, [isActive]);


  const duration = lyric.end - lyric.start;
  const [lines, setLines] = useState<Lyric[]>([
    { start: 0, end: duration - (Math.min(duration * 0.2, 750)), text: lyric.text },
  ]);

  useEffect(() => {
    if (lines.length === 1) {
      const actualLines = extractLines(
        ref.current!.querySelector(".background")!.firstChild!
      );
      if (actualLines.length > 1) {
        const { start, end: totalDuration, text } = lines[0];
        const totalLength = text.length;
        setLines(
          actualLines.reduce<{ lines: Lyric[]; start: number }>(
            ({ lines, start }, text) => {
              const duration = (text.length / totalLength) * totalDuration;
              const end = start + duration;
              return {
                lines: [
                  ...lines,
                  {
                    start,
                    text,
                    end,
                  },
                ],
                start: end,
              };
            },
            { lines: [], start }
          ).lines
        );
      }
    }
  }, [lines]);

  return (
    <div
      className={`lyric${isActive ? " active" : ""}`}
      style={
        { "--duration": `${lyric.end - lyric.start}ms` } as React.CSSProperties
      }
      ref={ref}
    >
      {lines.map((line) => (
        <div
          className="line"
          key={line.start}
          style={
            {
              "--start-delay": `${line.start}ms`,
              "--duration": `${line.end - line.start}ms`,
            } as React.CSSProperties
          }
        >
          <div className="background">{line.text}</div>
          <div className="highlight">{line.text}</div>
        </div>
      ))}
    </div>
  );
}
