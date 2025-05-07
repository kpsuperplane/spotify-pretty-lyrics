import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

import App from "./App";
import { SpotifyAuthHandler, SpotifyContextProvider } from "./lib/spotify";

function AppWithProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <SpotifyContextProvider>
        <App />
      </SpotifyContextProvider>
    </QueryClientProvider>
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Wrapper />
  </React.StrictMode>
);
