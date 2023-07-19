import { useState } from "react";
import ChatList from "./components/ChatList";
import MainPage from "./components/MainPage";
import TwitchVODPlayer from "./components/TwitchVODPlayer";

function App() {
  const videoId = window.location.pathname.match(
    /^\/(?:[^/]+\/v(?:ideo)?|videos)\/(\d+)/,
  )?.[1];
  const [time, setTime] = useState(0);
  const [dark, setDark] = useState(false);

  return (
    <div
      className={`container-fluid h-100${videoId ? " px-0" : ""}${
        dark ? " dark" : ""
      }`}
    >
      {videoId ? (
        <div className="row flex-column flex-md-row flex-nowrap h-100 no-gutters">
          <div className="col-md-9 flex-grow-0 flex-shrink-0 overflow-hidden">
            <TwitchVODPlayer videoId={videoId} time={time}></TwitchVODPlayer>
          </div>
          <div className="col-md-3 flex-grow-1 flex-shrink-1 h-100 overflow-auto">
            <ChatList
              videoId={videoId}
              dark={dark}
              setTime={setTime}
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
  );
}

export default App;
