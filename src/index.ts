import { definePlugin, Accessory, Icon, Command } from "@kepler-app/plugin-sdk";
import type { PluginContext, PluginListItem } from "@kepler-app/plugin-sdk";
import {
  resolveCountryCode,
  resolveTimeZone,
  friendlyTimeZoneName,
} from "./geo";

type TheirTimeUser = {
  name: string;
  xUsername: string;
  location: string;
  locationCity: string;
  locationCountry: string;
  locationCountryCode: string;
  locationTimeZone: string;
};

type AvatarSetting = {
  name: string;
  avatarUrl: string;
};

function countryCodeToFlag(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function localTimeFor(timeZone: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }).format(now);
  } catch {
    return "--:--";
  }
}

export default definePlugin({
  metadata: {
    id: "re.leob.TheirTime",
    name: "Their Time",
    version: "1.1.0",
    author: "Kepler Team",
    description: "See local times of friends across timezones",
    icon: Icon.sfSymbol("globe.badge.clock"),
    permissions: [],
    settings: [
      {
        id: "order",
        title: "Launcher Sort Order",
        description: "Controls the order of people in launcher results",
        kind: "picker",
        defaultValue: "ascending",
        options: [
          { id: "ascending", title: "Ascending" },
          { id: "descending", title: "Descending" },
        ],
      },
      {
        id: "people",
        title: "People",
        description: "Add friends to see their local time.",
        kind: "objectList",
        itemTitle: "Person",
        defaultValue: [],
        fields: [
          {
            id: "name",
            title: "Name",
            kind: "text",
            placeholder: "Laura",
            required: true,
          },
          {
            id: "xUsername",
            title: "X Username",
            kind: "text",
            placeholder: "laur_garden",
            required: false,
          },
          {
            id: "location",
            title: "Location",
            kind: "place",
            placeholder: "Berlin, Germany",
            required: false,
          },
        ],
      },
      {
        id: "avatars",
        title: "Avatar URLs",
        description: "Optional custom avatars matched by person name.",
        kind: "objectList",
        itemTitle: "Avatar",
        defaultValue: [],
        fields: [
          {
            id: "name",
            title: "Name",
            kind: "text",
            placeholder: "Nate",
            required: true,
          },
          {
            id: "avatarUrl",
            title: "Avatar URL",
            kind: "text",
            placeholder: "https://example.com/avatar.jpg",
            required: true,
          },
        ],
      },
    ],
  },
  searchModes: [
    Command.search({
      id: "show_their_timezone",
      title: "Their Timezones",
      keywords: ["timez", "timezone", "friends"],
      shortcutPrefix: "tz",
      async run(query, ctx: PluginContext): Promise<PluginListItem[]> {
        const order =
          ctx.settings.order === "descending" ? "descending" : "ascending";
        const people: TheirTimeUser[] = Array.isArray(ctx.settings.people)
          ? (ctx.settings.people as TheirTimeUser[])
          : [];
        const avatars: AvatarSetting[] = Array.isArray(ctx.settings.avatars)
          ? (ctx.settings.avatars as AvatarSetting[])
          : [];

        if (people.length === 0) {
          return [
            {
              id: "empty",
              title: "Add people in settings",
              subtitle:
                "Open Their Time settings to add names and a timezone or location",
              icon: Icon.sfSymbol("person.crop.circle.badge.plus"),
            },
          ];
        }

        const now = new Date(ctx.now);
        const avatarUrls = new Map(
          avatars
            .filter((avatar) => avatar.name && avatar.avatarUrl)
            .map((avatar) => [
              avatar.name.trim().toLowerCase(),
              avatar.avatarUrl.trim(),
            ]),
        );

        const entries = people.map((person) => {
          const username = person.xUsername.replace(/^@/, "");
          const customAvatarUrl = avatarUrls.get(
            person.name.trim().toLowerCase(),
          );
          const timeZone = resolveTimeZone(person);
          const timeStr = timeZone ? localTimeFor(timeZone, now) : "--:--";
          const tzFriendly = timeZone ? friendlyTimeZoneName(timeZone) : "";
          const locationStr = person.location || tzFriendly || "";
          const subtitleParts = [];
          if (username) subtitleParts.push(`@${username}`);
          if (locationStr) subtitleParts.push(locationStr);

          const avatarIcon = customAvatarUrl
            ? Icon.rounded(Icon.url(customAvatarUrl))
            : username
              ? Icon.rounded(
                  Icon.url(
                    `https://unavatar.io/x/${encodeURIComponent(username)}`,
                  ),
                )
              : Icon.sfSymbol("person.crop.circle");

          const countryCode = resolveCountryCode(person);
          const badgeIcon = countryCode
            ? Icon.emoji(countryCodeToFlag(countryCode))
            : Icon.emoji("🌐");

          const sortMinutes =
            timeStr === "--:--"
              ? Infinity
              : (Number(timeStr.slice(0, 2)) * 60 +
                  Number(timeStr.slice(3, 5)) -
                  300 +
                  1440) %
                1440;

          return {
            item: {
              id: person.name.toLowerCase().replace(/\s+/g, "-"),
              title: person.name,
              subtitle: subtitleParts.join(" · "),
              icon: Icon.withBadge(avatarIcon, badgeIcon),
              accessory: Accessory.text(timeStr, true),
            },
            sortMinutes,
          };
        });
        entries.sort((a, b) => {
          const aMissing = a.sortMinutes === Infinity;
          const bMissing = b.sortMinutes === Infinity;
          if (aMissing && bMissing) return 0;
          if (aMissing) return 1;
          if (bMissing) return -1;
          return order === "descending"
            ? a.sortMinutes - b.sortMinutes
            : b.sortMinutes - a.sortMinutes;
        });
        return entries.map((e) => e.item);
      },
    }),
  ],
});
