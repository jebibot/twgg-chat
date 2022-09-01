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
const API_URL = "https://api.twitch.tv/kraken/";
const API_WORKER_URL = "https://api.twgg.workers.dev/";
const BADGES_API_URL = "https://badges.twitch.tv/v1/badges/";

const MAX_RETRIES = 5;

type VideoData = {
  id: string;
  duration: string;
  userId: string;
};
type Videos = { [id: string]: VideoData };

type CommenterData = {
  _id: string;
  bio: string | null;
  created_at: string;
  display_name: string;
  logo: string;
  name: string;
  type: string;
  updated_at: string;
};

type EmoticonData = {
  _id: string;
  begin: number;
  end: number;
};

type EmoticonFragmentData = {
  emoticon_id: string;
  emoticon_set_id: string;
};

export type FragmentData = {
  text: string;
  emoticon?: EmoticonFragmentData;
};

export type BadgeData = {
  _id: string;
  version: string;
};

type MessageData = {
  body: string;
  emoticons?: EmoticonData[];
  fragments?: FragmentData[];
  is_action: boolean;
  user_badges?: BadgeData[];
  user_color?: string;
  user_notice_params: any;
};

export type CommentData = {
  _id: string;
  channel_id: string;
  commenter: CommenterData;
  content_id: string;
  content_offset_seconds: number;
  content_type: string;
  created_at: string;
  message: MessageData;
  source: string;
  state: string;
  updated_at: string;
};

export type CommentsData = {
  comments?: CommentData[];
  _next?: string;
  _prev?: string;
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

  async getWithRetry<T>(input: RequestInfo, headers?: Record<string, string>) {
    let body;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const res = await fetch(input, {
          method: "GET",
          headers,
          keepalive: this.keepalive,
          signal: this.signal,
        });
        body = await res.json();
        if (!res.ok) {
          throw new Error(
            `HTTP ${res.status}: ${res.statusText}
  
${JSON.stringify(body, null, 2)}`
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

  async callApi<T>(path: string) {
    return this.getWithRetry<T>(`${API_URL}${path}`, {
      Accept: "application/vnd.twitchtv.v5+json",
      "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
    });
  }

  async callBadgesApi<T>(path: string) {
    return this.getWithRetry<T>(`${BADGES_API_URL}${path}`, {
      Accept: "application/json",
    });
  }

  async getVideoDuration(videoId: string) {
    const result = await this.getWithRetry<Videos>(
      `${API_WORKER_URL}videos?id=${videoId}`
    );
    return result[videoId];
  }

  async getComments(videoId: string, cursor: string) {
    return this.callApi<CommentsData>(
      `videos/${videoId}/comments?${
        cursor ? `cursor=${cursor}` : "content_offset_seconds=0"
      }`
    );
  }

  async *iterateComments(videoId: string) {
    let next: string | undefined = "";
    while (next != null) {
      const result: CommentsData = await this.getComments(videoId, next);
      yield result.comments;
      next = result._next;
    }
  }

  async getGlobalBadges() {
    const badges = await this.callBadgesApi<BadgesData>("global/display");
    return badges.badge_sets;
  }

  async getChannelBadges(channelId: string) {
    const globalBadgeSets = await this.getGlobalBadges();
    const channelBadges = await this.callBadgesApi<BadgesData>(
      `channels/${channelId}/display`
    );
    return Object.assign(globalBadgeSets, channelBadges.badge_sets);
  }
}

export default Twitch;
