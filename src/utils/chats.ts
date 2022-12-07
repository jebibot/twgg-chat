import {
  VideoCommentEdge,
  Badge,
  VideoCommentMessageFragment,
} from "../api/Twitch";
import { ColorAdjuster } from "./color";

const BOTS = [
  "ssakdook",
  "bbangddeock",
  "cubicbot_",
  "streamelements",
  "streamlabs",
  "twipkr",
  "dolmaig",
];
const BADGES = ["broadcaster", "vip", "moderator", "partner"];

export type ChatEntry = {
  id: string;
  timestamp: number;
  display_name: string;
  name: string;
  color: string | null;
  darkColor: string | null;
  badges: Badge[];
  message: VideoCommentMessageFragment[];
};

const colorAdjuster = new ColorAdjuster("#ffffff", 1);
const darkColorAdjuster = new ColorAdjuster("#181818", 1);

async function getChats(comments: VideoCommentEdge[]): Promise<ChatEntry[]> {
  return comments.map((c) => ({
    id: c.node.id,
    timestamp: c.node.contentOffsetSeconds,
    display_name: c.node.commenter?.displayName || "",
    name: c.node.commenter?.login || "",
    color: colorAdjuster.process(c.node.message.userColor),
    darkColor: darkColorAdjuster.process(c.node.message.userColor),
    badges: c.node.message.userBadges,
    message: c.node.message.fragments,
  }));
}

export function isStreamer(c: ChatEntry) {
  return (
    c.badges.some((b) => BADGES.includes(b.setID)) &&
    !c.name.endsWith("bot") &&
    !BOTS.includes(c.name)
  );
}

export default getChats;
