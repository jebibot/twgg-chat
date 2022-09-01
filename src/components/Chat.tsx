import { useContext } from "react";
import * as CSS from "csstype";
import ChatBadge from "./ChatBadge";
import ChatEmoticon from "./ChatEmoticon";
import { AppDispatch } from "../App";
import { ChatEntry } from "../utils/chats";
import { formatTimestamp } from "../utils/utils";
import styles from "./Chat.module.css";

type ChatProps = {
  chat: ChatEntry;
  dark: boolean;
};

function Chat({ chat, dark }: ChatProps) {
  const appDispatch = useContext(AppDispatch);
  return (
    <div className="px-3 py-2">
      <span
        className={`${styles.timestamp} mr-2`}
        onClick={() =>
          appDispatch?.({ type: "seek", timestamp: chat.timestamp })
        }
      >
        {formatTimestamp(chat.timestamp)}
      </span>
      <span>
        {chat.badges?.map((b) => (
          <ChatBadge key={b._id} badge={b}></ChatBadge>
        ))}
      </span>
      <span
        className={styles.author}
        style={{ color: dark ? chat.darkColor : chat.color } as CSS.Properties}
      >
        <span className="font-weight-bold">{chat.display_name}</span>
        {chat.display_name.toLowerCase() !== chat.name && (
          <span className={styles.username}> ({chat.name})</span>
        )}
      </span>
      <span aria-hidden="true">: </span>
      <span className={styles.message}>
        {chat.message.map((m, i) =>
          m.emoticon ? (
            <ChatEmoticon
              key={i}
              emoticonId={m.emoticon.emoticon_id}
              name={m.text}
            ></ChatEmoticon>
          ) : (
            <span key={i}>{m.text}</span>
          )
        )}
      </span>
    </div>
  );
}

export default Chat;
