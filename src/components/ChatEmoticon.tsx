import styles from "./ChatEmoticon.module.css";

const EMOTICON_URL = (id: string, scale: number) =>
  `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/light/${scale}.0`;

type ChatEmoticonProps = {
  emoticonId: string;
  name: string;
};

function ChatEmoticon({ emoticonId, name }: ChatEmoticonProps) {
  return (
    <img
      src={`${EMOTICON_URL(emoticonId, 1)}`}
      srcSet={`${EMOTICON_URL(emoticonId, 1)} 1x, ${EMOTICON_URL(
        emoticonId,
        2,
      )} 2x, ${EMOTICON_URL(emoticonId, 3)} 4x`}
      alt={name}
      className={`${styles.emoticon} my-n1 align-middle`}
    ></img>
  );
}

export default ChatEmoticon;
