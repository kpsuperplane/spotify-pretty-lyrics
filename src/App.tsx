import React from "react";

import { SpotifyAuthenticationError } from "./lib/spotify";
import Main from "./Main";
import Splash from "./Splash";

type TState = { showAuth: boolean };
class App extends React.Component<{}, TState> {
  constructor(props: {}) {
    super(props);
    this.state = { showAuth: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { showAuth: error instanceof SpotifyAuthenticationError };
  }
  componentDidCatch(error: Error) {
    if (error instanceof SpotifyAuthenticationError) {
      return;
    } else {
      throw error;
    }
  }
  render() {
    // show the login page if we try to do
    // anything that requires auth without a token
    if (this.state.showAuth) {
      return <Splash />;
    }
    return <Main />;
  }
}

export default App;
