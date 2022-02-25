import { useEffect, useState } from "react";
import { useLyrics } from "../lib/lyrics";
import useSpotify, { TSong } from "../lib/spotify";
import Beautify from "./renderers/Beautify";

export default function Main() {
  const [data, setData] = useState<TSong | null>(null);
  const spotify = useSpotify();

  const lyrics = useLyrics(data?.item ?? null);

  useEffect(() => {
    let nextSong: number | null = null;
    function fetch() {
      if (nextSong != null) {
        clearTimeout(nextSong);
      }
      spotify.getMyCurrentPlaybackState().then((newData) => {
        if (typeof newData === "object" && newData.item != null) {
          if (
            newData.item.id !== data?.item?.id ||
            newData.is_playing !== data?.is_playing ||
            newData.progress_ms !== data?.progress_ms
          ) {
            newData.timestamp = new Date().getTime() + 700;
            setData(newData);
            if (newData.progress_ms != null) {
              nextSong = setTimeout(
                () => fetch(),
                newData.item.duration_ms - newData.progress_ms + 1000
              );
            }
          }
        } else {
          setData(null);
        }
      });
    }
    const interval = setInterval(() => fetch(), 5000);
    fetch();
    return () => {
      if (nextSong != null) {
        clearTimeout(nextSong);
      }
      clearInterval(interval);
    };
  }, []);

  return <Beautify song={data} lyrics={lyrics} />;
}
