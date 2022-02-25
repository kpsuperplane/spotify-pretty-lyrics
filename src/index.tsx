import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import { SpotifyAuthHandler, SpotifyContextProvider } from "./lib/spotify";

function AppWithProvider() {
  return (
    <SpotifyContextProvider>
      <App />
    </SpotifyContextProvider>
  );
}
function Wrapper() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppWithProvider />} />
        <Route path="/oauth" element={<SpotifyAuthHandler />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <Wrapper />
  </React.StrictMode>,
  document.getElementById("root")
);
