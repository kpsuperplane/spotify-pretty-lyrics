import { useEffect, useState } from "react";
import useSpotify from "../lib/spotify";

export default function Main() {
  const [data, setData] = useState<SpotifyApi.CurrentPlaybackResponse | null>(
    null
  );
  const spotify = useSpotify();
  useEffect(() => {
    const interval = setInterval(() => {
      spotify.getMyCurrentPlaybackState().then((data) => {
        if (typeof data === "object") {
          setData(data);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div>
      <p>
        <strong>
          Is Playing: <code>{data?.item?.name}</code>
        </strong>
      </p>
      <p>
        Is Playing: <code>{data?.is_playing ? "true" : "false"}</code>
      </p>
      <p>
        Progress: <code>{data?.progress_ms}</code>
      </p>
      <p>
        Timestamp: <code>{data?.timestamp}</code>
      </p>
      <p>Duration: <code>{data?.item?.duration_ms}</code></p>
    </div>
  );
}
