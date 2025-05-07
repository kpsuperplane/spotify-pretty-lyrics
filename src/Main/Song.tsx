import React, { useCallback, useRef, useState } from "react";
import Lyrics from "./Lyrics";
import { Song } from ".";
import ColorThief from "colorthief";

const colorThief = new ColorThief();

type Color = [number, number, number];

function toRgb(color: Color): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

export default function ({ song }: { song: Song }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [colors, setColors] = useState<[Color, Color, Color, Color] | null>(
    null
  );
  const getColor = useCallback(() => {
    setColors(colorThief.getPalette(imageRef.current, 4));
  }, []);
  return (
    <div
      id="song"
      style={colors != null ? { backgroundColor: toRgb(colors[0]) } : undefined}
    >
      {colors != null && (
        <>
          <div
            className="circle"
            id="circleA"
            style={
              {
                "--color": toRgb(colors[1]),
              } as React.CSSProperties
            }
          />
          <div
            className="circle"
            id="circleB"
            style={
              {
                "--color": toRgb(colors[2]),
              } as React.CSSProperties
            }
          />
          <div
            className="circle"
            id="circleC"
            style={
              {
                "--color": toRgb(colors[3]),
              } as React.CSSProperties
            }
          />
        </>
      )}
      <div className="content">
        <div id="song-header">
          <div id="song-header-content" className="content">
            <img
              src={song.item.album.images[0].url}
              id="song-header-image"
              crossOrigin="anonymous"
              onLoad={getColor}
              ref={imageRef}
            />
            <div id="song-header-text">
              <h2>{song.item.name}</h2>
              <h3>{song.item.artists.map((a) => a.name).join(", ")}</h3>
            </div>
          </div>
        </div>
        <React.Suspense fallback={"Loading..."}>
          <Lyrics song={song} />
        </React.Suspense>
      </div>
    </div>
  );
}
