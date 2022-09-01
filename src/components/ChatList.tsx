import { useState, useEffect, useRef, createContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faInfoCircle,
  faCircleHalfStroke,
} from "@fortawesome/free-solid-svg-icons";
import * as Sentry from "@sentry/react";
import ProgressBar from "./ProgressBar";
import Chat from "./Chat";
import Twitch, { BadgeSetsData } from "../api/Twitch";
import getChats, { ChatEntry, isStreamer } from "../utils/chats";
import captureToPng from "../utils/html2canvas";

export const BadgesContext = createContext<BadgeSetsData | undefined>(
  undefined
);

type ChatListProps = {
  videoId: string;
  dark: boolean;
  toggleDark: () => void;
};

function ChatList({ videoId, dark, toggleDark }: ChatListProps) {
  const chatList = useRef<HTMLDivElement>(null);

  const [badges, setBadges] = useState<BadgeSetsData>();
  const [videoLength, setVideoLength] = useState(Infinity);
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [lastChat, setLastChat] = useState(0);
  const [error, setError] = useState("");

  function handleError(err: Error) {
    Sentry.captureException(err);
    if (err.name === "AbortError") return;
    setError((e) => `${e ? `${e}, ` : ""}${err.name}: ${err.message}`);
  }

  useEffect(() => {
    let abortController: AbortController | undefined;
    if ("AbortController" in window) {
      abortController = new AbortController();
    }

    const twitch = new Twitch(abortController?.signal);

    setChats([]);
    setError("");

    (async function () {
      const video = await twitch.getVideoDuration(videoId);
      if (video) {
        const match = video.duration.match(/^(\d+h)?(\d+m)?(\d+s)?$/);
        if (match) {
          setVideoLength(
            3600 * parseInt(match[1] || "0") +
              60 * parseInt(match[2] || "0") +
              parseInt(match[3] || "0")
          );
        }
        setBadges(await twitch.getChannelBadges(video.userId));
      }
    })().catch(handleError);

    (async function () {
      for await (const comments of twitch.iterateComments(videoId)) {
        if (comments?.length) {
          const chats = await getChats(comments);
          setLastChat(chats[chats.length - 1].timestamp);
          setChats((c) => c.concat(chats.filter(isStreamer)));
        }
      }

      setLastChat(Infinity);
      setTimeout(() => {
        setLastChat(-1);
      }, 3000);
    })().catch(handleError);

    return () => {
      abortController?.abort();
    };
  }, [videoId]);

  const progress = (Math.min(lastChat / videoLength, 1) * 100).toFixed(2);

  return (
    <BadgesContext.Provider value={badges}>
      <div className="d-flex">
        <div className="p-1">
          <button
            type="button"
            className="btn btn-primary f-14"
            aria-label="Download as an image"
            title="Download as an image"
            onClick={() => {
              if (!chatList.current) return;
              captureToPng(chatList.current, `chat-${videoId}.png`);
            }}
          >
            <FontAwesomeIcon icon={faDownload} />
          </button>
        </div>
        <div className="flex-grow-1 my-auto">
          <ProgressBar error={error} progress={progress}></ProgressBar>
        </div>
        <div className="p-1">
          <a
            href="https://twgg.notion.site/Rechat-63ee83dd92384963a162895ac2553f70"
            className="btn btn-secondary f-14"
            aria-label="Info"
            title="Info"
            target="_blank"
            rel="noopener noreferrer"
            role="button"
          >
            <FontAwesomeIcon icon={faInfoCircle} />
          </a>
          <button
            type="button"
            className={`btn ${dark ? "btn-light" : "btn-dark"} f-14 ml-1`}
            aria-label="Toggle the dark mode"
            title="Toggle the dark mode"
            onClick={() => {
              toggleDark();
            }}
          >
            <FontAwesomeIcon icon={faCircleHalfStroke} />
          </button>
        </div>
      </div>
      <div ref={chatList}>
        {chats.map((chat) => (
          <Chat key={chat.id} chat={chat} dark={dark}></Chat>
        ))}
      </div>
    </BadgesContext.Provider>
  );
}

export default ChatList;
