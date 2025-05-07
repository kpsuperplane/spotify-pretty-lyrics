import { useQuery } from "@tanstack/react-query";
import { Song } from ".";
import { useMemo } from "react";
import { Lyric } from "./Lyric";

type APIResponse = {
  albumName: string;
  artistName: string;
  duration: number;
  id: number;
  instrumental: boolean;
  name: string;
  plainLyrics: string;
  syncedLyrics: string;
  trackName: string;
};

export default function useLyrics({
  item: {
    name: track_name,
    duration_ms: durationMs,
    album: { name: album_name },
    artists: [{ name: artist_name }],
  },
  duration,
}: Song): Lyric[] | null {
  const { data } = useQuery<APIResponse>({
    queryKey: ["lyrics", artist_name, track_name, album_name, duration],
    queryFn: () =>
      fetch(
        "https://lrclib.net/api/get?" +
          new URLSearchParams({
            artist_name: artist_name,
            track_name: track_name,
            album_name: album_name,
            duration: duration.toString(),
          }).toString()
      ).then((res) => res.json()),
  });
  const syncedLyrics = data?.syncedLyrics;
  return useMemo(
    () =>
      syncedLyrics
        ?.split("\n")
        ?.map((line) => {
          const match = line.match(/\[(\d+)\:(\d+).(\d+)\](.+)/);
          if (match == null) {
            return null;
          }
          const [_, min, sec, ms, text] = match;
          return {
            text,
            start: Number(ms) + Number(sec) * 1000 + Number(min) * 1000 * 60,
          };
        })
        ?.filter((x) => x != null)
        ?.map((line, index, all) => ({
          ...line,
          end: index + 1 < all.length ? all[index + 1].start : durationMs,
        })) ?? null,
    [syncedLyrics, durationMs]
  );
}
