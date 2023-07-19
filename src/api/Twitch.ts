/** @license Twitch.js
 * https://github.com/twurple/twurple
 *
 * MIT License
 *
 * Copyright (c) 2017-2021 Daniel Fischer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const GRAPHQL_API_URL = "https://gql.twitch.tv/gql";
const API_WORKER_URL = "https://api.twgg.workers.dev/";
const BADGES_API_URL = "https://badges.twitch.tv/v1/badges/";

const MAX_RETRIES = 5;

type VideoData = {
  id: string;
  duration: string;
  userId: string;
};
type Videos = { [id: string]: VideoData };

type User = {
  displayName: string;
  id: string;
  login: string;
  __typename: "User";
};

type EmbeddedEmote = {
  emoteID: string;
  from: number;
  id: string;
  __typename: "EmbeddedEmote";
};

export type VideoCommentMessageFragment = {
  emote: EmbeddedEmote | null;
  text: string;
  __typename: "VideoCommentMessageFragment";
};

export type Badge = {
  id: string;
  setID: string;
  version: string;
  __typename: "Badge";
};

type VideoCommentMessage = {
  fragments: VideoCommentMessageFragment[];
  userBadges: Badge[];
  userColor: string | null;
  __typename: "VideoCommentMessage";
};

type VideoComment = {
  commenter: User | null;
  contentOffsetSeconds: number;
  createdAt: string;
  id: string;
  message: VideoCommentMessage;
  __typename: "VideoComment";
};

export type VideoCommentEdge = {
  cursor: string;
  node: VideoComment;
  __typename: "VideoCommentEdge";
};

type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  __typename: "PageInfo";
};

type VideoCommentConnection = {
  edges: VideoCommentEdge[];
  pageInfo: PageInfo;
  __typename: "VideoCommentConnection";
};

type Video = {
  comments: VideoCommentConnection;
  creator: User;
  id: string;
  __typename: "Video";
};

type CommentsData = {
  video: Video;
};

type ExtensionsData = {
  durationMilliseconds: number;
  operationName: string;
  requestID: string;
};

export type CommentsResponse = {
  data: CommentsData;
  extensions: ExtensionsData;
};

type BadgeVersionData = {
  click_action: string;
  click_url: string;
  description: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
};

type BadgeSetData = {
  versions: Record<string, BadgeVersionData>;
};

export type BadgeSetsData = Record<string, BadgeSetData>;

type BadgesData = {
  badge_sets: BadgeSetsData;
};

class Twitch {
  signal?: AbortSignal;
  keepalive?: boolean;

  constructor(signal?: AbortSignal) {
    this.signal = signal;
    this.keepalive = true;
  }

  async fetchWithRetry<T>(input: RequestInfo, init: RequestInit) {
    let body;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const res = await fetch(input, {
          ...init,
          keepalive: this.keepalive,
          signal: this.signal,
        });
        body = await res.json();
        if (!res.ok) {
          throw new Error(
            `HTTP ${res.status}: ${res.statusText}
  
${JSON.stringify(body, null, 2)}`,
          );
        }
        break;
      } catch (err: any) {
        if (i === MAX_RETRIES - 1 || err.name === "AbortError") {
          throw err;
        }
        if (err instanceof TypeError) {
          this.keepalive = undefined;
        }
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 200));
      }
    }
    return body as T;
  }

  async getWithRetry<T>(input: RequestInfo, headers?: Record<string, string>) {
    return this.fetchWithRetry<T>(input, { method: "GET", headers });
  }

  async callGraphQLApi<T>(body: any) {
    return this.fetchWithRetry<T>(GRAPHQL_API_URL, {
      method: "POST",
      headers: {
        "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
      },
      body: JSON.stringify(body),
    });
  }

  async callBadgesApi<T>(path: string) {
    // [{"operationName":"ChatList_Badges","variables":{"channelLogin":},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"86f43113c04606e6476e39dcd432dee47c994d77a83e54b732e11d4935f0cd08"}}}]
    return this.getWithRetry<T>(`${BADGES_API_URL}${path}`, {
      Accept: "application/json",
    });
  }

  async getVideoDuration(videoId: string) {
    const result = await this.getWithRetry<Videos>(
      `${API_WORKER_URL}videos?id=${videoId}`,
    );
    return result[videoId];
  }

  async getComments(videoID: string, cursor: string | undefined) {
    return (
      await this.callGraphQLApi<[CommentsResponse]>([
        {
          operationName: "VideoCommentsByOffsetOrCursor",
          variables: {
            videoID,
            ...(cursor ? { cursor } : { contentOffsetSeconds: 0 }),
          },
          extensions: {
            persistedQuery: {
              version: 1,
              sha256Hash:
                "b70a3591ff0f4e0313d126c6a1502d79a1c02baebb288227c582044aa76adf6a",
            },
          },
        },
      ])
    )[0];
  }

  async *iterateComments(videoId: string) {
    let cursor: string | undefined;
    do {
      const result: CommentsResponse = await this.getComments(videoId, cursor);
      const edges = result.data.video.comments.edges;
      yield edges;
      cursor = edges[0]?.cursor;
    } while (cursor);
  }

  async getGlobalBadges() {
    const badges = await this.callBadgesApi<BadgesData>("global/display");
    return badges.badge_sets;
  }

  async getChannelBadges(channelId: string) {
    const globalBadgeSets = await this.getGlobalBadges();
    const channelBadges = await this.callBadgesApi<BadgesData>(
      `channels/${channelId}/display`,
    );
    return Object.assign(globalBadgeSets, channelBadges.badge_sets);
  }
}

export default Twitch;
