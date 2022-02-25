import type { VercelRequest, VercelResponse } from "@vercel/node";
import axios from "axios";

export default async (req: VercelRequest, res: VercelResponse) => {
  const { song } = req.query;
  if (typeof song === "string" && song.length > 3) {
    const songs_res = await axios.get(
      "https://c.y.qq.com/soso/fcgi-bin/client_search_cp",
      {
        params: {
          w: song,
          format: "json",
        },
      }
    );
    const songs = songs_res?.data?.data?.song?.list;
    if (songs == null || songs.length === 0) {
      res.status(404).send("No songs found");
    } else {
      const songmid = songs[0].songmid;
      const lyrics_res = await axios.get(
        "https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_yqq.fcg",
        {
          params: {
            songmid,
            format: "json",
          },
          headers: {
            Referer: "https://y.qq.com",
          },
        }
      );
      const lyrics = lyrics_res?.data?.lyric;
      if (lyrics == null) {
        res.status(404).send("No lyrics found for song");
      } else {
        const buf = Buffer.from(lyrics, "base64");
        res.status(200).send(buf.toString("utf-8"));
      }
    }
  } else {
    res.status(400).send("Missing `song` get parameter");
  }
};
