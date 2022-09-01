import React, { useReducer, createContext, useState } from "react";
import ChatList from "./components/ChatList";
import MainPage from "./components/MainPage";
import TwitchVODPlayer from "./components/TwitchVODPlayer";

type AppAction = {
  type: "seek";
  timestamp: number;
};

const initialState = {
  timestamp: 0,
};
export const AppDispatch = createContext<React.Dispatch<AppAction> | null>(
  null
);

function reducer(state: typeof initialState, action: AppAction) {
  switch (action.type) {
    case "seek":
      return {
        timestamp: action.timestamp,
      };
  }
}

function App() {
  const videoId = window.location.pathname.match(
    /^\/(?:[^/]+\/v(?:ideo)?|videos)\/(\d+)/
  )?.[1];
  const [app, dispatch] = useReducer(reducer, initialState);
  const [dark, setDark] = useState(false);

  return (
    <AppDispatch.Provider value={dispatch}>
      <div
        className={`container-fluid h-100${videoId ? " px-0" : ""}${
          dark ? " dark" : ""
        }`}
      >
        {videoId ? (
          <div className="row flex-column flex-md-row flex-nowrap h-100 no-gutters">
            <div className="col-md-9 flex-grow-0 flex-shrink-0 overflow-hidden">
              <TwitchVODPlayer
                videoId={videoId}
                time={app.timestamp}
              ></TwitchVODPlayer>
            </div>
            <div className="col-md-3 flex-grow-1 flex-shrink-1 h-100 overflow-auto">
              <ChatList
                videoId={videoId}
                dark={dark}
                toggleDark={() => {
                  setDark((d) => !d);
                }}
              ></ChatList>
            </div>
          </div>
        ) : (
          <MainPage></MainPage>
        )}
      </div>
    </AppDispatch.Provider>
  );
}

export default App;
