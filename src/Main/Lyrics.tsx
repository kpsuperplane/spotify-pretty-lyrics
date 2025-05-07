import { Song } from ".";
import Lyric from "./Lyric";
import useLyrics from "./useLyrics";

export default function Lyrics({ song }: { song: Song }) {
  const lyrics = useLyrics(song);
  return (
    <div id="lyrics">
      {lyrics?.map((lyric) => (
        <Lyric key={lyric.start} lyric={lyric} song={song} />
      )) ?? "Lyrics Unknown"}
    </div>
  );
}
