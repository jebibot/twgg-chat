import * as CSS from "csstype";
import ChatBadge from "./ChatBadge";
import ChatEmoticon from "./ChatEmoticon";
import { ChatEntry } from "../utils/chats";
import { formatTimestamp } from "../utils/utils";
import styles from "./Chat.module.css";

type ChatProps = {
  chat: ChatEntry;
  dark: boolean;
  setTime: (time: number) => void;
};

function Chat({ chat, dark, setTime }: ChatProps) {
  return (
    <div className="px-3 py-2">
      <span
        className={`${styles.timestamp} mr-2`}
        onClick={() => {
          setTime(chat.timestamp);
        }}
      >
        {formatTimestamp(chat.timestamp)}
      </span>
      <span>
        {chat.badges.map((b) => (
          <ChatBadge key={b.id} badge={b}></ChatBadge>
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
          m.emote ? (
            <ChatEmoticon
              key={i}
              emoticonId={m.emote.emoteID}
              name={m.text}
            ></ChatEmoticon>
          ) : (
            <span key={i}>{m.text}</span>
          ),
        )}
      </span>
    </div>
  );
}

export default Chat;
