import { createContext, useContext } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import api from "./api";
import auth from "./auth";
import SpotifyAuthHandler from "./SpotifyAuthHandler";

function getToken() {
  auth.fetchAuthorizationCode();
}
type TSpotifyContext = {
  api: SpotifyWebApi.SpotifyWebApiJs;
  getToken: () => void;
};

export type TSong = SpotifyApi.CurrentPlaybackResponse;

export const SpotifyContext = createContext<TSpotifyContext>({
  api,
  getToken,
});

type TProps = {
  children: React.ReactElement;
};
export function SpotifyContextProvider(props: TProps) {
  const token = localStorage.getItem("token");
  // not very "functional" but it works lol
  if (token != null && api.getAccessToken() == null && !auth.isAccessTokenExpired()) {
    api.setAccessToken(token);
  }

  const value = { api, getToken };

  return (
    <SpotifyContext.Provider value={value}>
      {props.children}
    </SpotifyContext.Provider>
  );
}

export class SpotifyAuthenticationError extends Error {}

export default function useSpotify() {
  const context = useContext(SpotifyContext);
  if (context.api.getAccessToken() == null) {
    throw new SpotifyAuthenticationError("User not logged in");
  }
  return context.api;
}

export {
  api,
  SpotifyAuthHandler
};