import axios from "axios";
import { useEffect, useMemo, useState } from "react";

export type TLyrics = {
  info: {
    ti?: string;
    ar?: string;
    al?: string;
    by?: string;
    offset?: string;
  };
  lyrics: {
    timestamp: number;
    content: string;
  }[];
};

function parseName(name: string) {
  return name
    .split("-")[0]
    .replace(/#/g, "")
    .replace(/\(.*?\)/g, "");
}

export function useLyrics(
  songObj: SpotifyApi.TrackObjectSimplified | null
): TLyrics | null {
  const [cache, setCache] = useState<TLyrics | null>(null);
  const song =
    songObj == null
      ? null
      : `${songObj.artists.map((ar) => ar.name).join(" & ")} - ${parseName(
          songObj.name
        )}`;
  useEffect(() => {
    setCache(null);
    if (song == null) return;
    axios.get("/api/lyrics", { params: { song } }).then((response) => {
      const data = response.data as TLyrics;
      data.lyrics = data.lyrics.filter(
        (l) => !l.content.includes(":") && !l.content.includes("：") && !l.content.includes("/")
      );
      setCache(data);
    });
  }, [song]);
  return cache;
}
