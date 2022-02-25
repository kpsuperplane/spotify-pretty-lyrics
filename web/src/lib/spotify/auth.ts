
import { OAuth2AuthCodePKCE } from "@bity/oauth2-auth-code-pkce";
import urljoin from "url-join";

const auth = new OAuth2AuthCodePKCE({
  authorizationUrl: "https://accounts.spotify.com/authorize",
  tokenUrl: "https://accounts.spotify.com/api/token",
  clientId: "4795b7b833b9464fa3b2abbf59d9a329",
  scopes: ["user-read-playback-state"],
  redirectUrl: urljoin(document.location.origin, "/oauth"),
  onAccessTokenExpiry(refreshAccessToken) {
    console.log("Expired! Access token needs to be renewed.");
    alert(
      "We will try to get a new access token via grant code or refresh token."
    );
    return refreshAccessToken();
  },
  onInvalidGrant(refreshAuthCodeOrRefreshToken) {
    console.log("Expired! Auth code or refresh token needs to be renewed.");
    alert("Redirecting to auth server to obtain a new auth grant code.");
    return refreshAuthCodeOrRefreshToken();
  },
});

export default auth;