import { useContext } from "react";
import { SpotifyContext } from "./lib/spotify";

export default function Splash() {
  const { getToken } = useContext(SpotifyContext);
  return (
    <div>
      <h1>Splash Page</h1>
      <button onClick={getToken}>Log in</button>
    </div>
  );
}
