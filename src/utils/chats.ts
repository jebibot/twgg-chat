import { CommentData, BadgeData, FragmentData } from "../api/Twitch";
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
  badges: BadgeData[] | undefined;
  message: FragmentData[];
};

const colorAdjuster = new ColorAdjuster("#ffffff", 1);
const darkColorAdjuster = new ColorAdjuster("#181818", 1);

async function getChats(comments: CommentData[]): Promise<ChatEntry[]> {
  return comments.map((c) => ({
    id: c._id,
    timestamp: c.content_offset_seconds,
    display_name: c.commenter.display_name,
    name: c.commenter.name,
    color: colorAdjuster.process(c.message.user_color),
    darkColor: darkColorAdjuster.process(c.message.user_color),
    badges: c.message.user_badges,
    message: c.message.fragments ?? [{ text: c.message.body }],
  }));
}

export function isStreamer(c: ChatEntry) {
  return (
    !!c.badges &&
    c.badges.some((b) => BADGES.includes(b._id)) &&
    !c.name.endsWith("bot") &&
    !BOTS.includes(c.name)
  );
}

export default getChats;
