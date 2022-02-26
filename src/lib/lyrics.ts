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
    axios
      .get("/api/lyrics", { params: { song } })
      .then((response) => {
        const data = response.data as TLyrics;
        data.lyrics = data.lyrics
          .filter(
            (l) =>
              !l.content.includes(":") &&
              !l.content.includes("：") &&
              !l.content.includes("/")
          )
          .filter(
            (l, i, arr) =>
              !(
                l.content.trim() === "" &&
                i < arr.length - 1 &&
                arr[i + 1].timestamp - l.timestamp < 4
              )
          );
        if (data.lyrics.length > 0 && data.lyrics[0].timestamp >= 4) {
          data.lyrics = [{ timestamp: 0, content: "" }, ...data.lyrics];
        }
        setCache(data);
      })
      .catch((error) => {
        setCache({
          info: {},
          lyrics: [
            {
              timestamp: 0,
              content: "No lyrics available",
            },
            {
              timestamp: 5,
              content: "♪ ♫ ♬",
            },
          ],
        });
      });
  }, [song]);
  return cache;
}
