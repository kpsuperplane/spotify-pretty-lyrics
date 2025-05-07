import { useEffect, useMemo } from "react";
import useSpotify, { TSong } from "../lib/spotify";
import Song from "./Song";
import { useQuery } from "@tanstack/react-query";

export type Song = {
  item: NonNullable<TSong['item']>,
  progressMs: number;
  duration: number,
  updatedAt: number;
  isPlaying: boolean;
};

export default function Main() {
  const spotify = useSpotify();

  const { data, dataUpdatedAt, refetch } = useQuery<TSong>({
    queryKey: ["status"],
    queryFn: () => spotify.getMyCurrentPlaybackState(),
  });

  const item = data?.item;
  const durationMs = data?.item?.duration_ms;
  const isPlaying = data?.is_playing;
  const progressMs = data?.progress_ms;

  const song = useMemo<Song | null>(
    () =>
      item != null && 
      durationMs != null &&
      isPlaying != null &&
      progressMs != null
        ? {
            item,
            duration: Math.round(durationMs / 1000),
            isPlaying,
            progressMs,
            updatedAt: (new Date().getTime() + dataUpdatedAt) / 2,
          }
        : null,
    [
      item?.id,
      durationMs,
      isPlaying,
      progressMs,
      dataUpdatedAt,
    ]
  );

  useEffect(() => {
    const interval = setInterval(refetch, 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    if (durationMs != null && progressMs != null) {
      const timeout = setTimeout(refetch, durationMs - progressMs + 1000);
      return () => clearTimeout(timeout);
    }
  }, [durationMs, progressMs, refetch]);

  return song != null ? <Song song={song} /> : "Loading song...";
}
