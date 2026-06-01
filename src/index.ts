import {
  definePlugin,
  Accessory,
  Icon,
  Command,
} from "@kepler-app/plugin-sdk";
import type { PluginContext, PluginListItem } from "@kepler-app/plugin-sdk";
import { resolveCountryCode, resolveTimeZone } from "./geo";

type TheirTimeUser = {
  name: string;
  xUsername: string;
  location: string;
  locationCity: string;
  locationCountry: string;
  locationCountryCode: string;
  locationTimeZone: string;
};

function countryCodeToFlag(countryCode: string): string {
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) =>
      String.fromCodePoint(127397 + char.charCodeAt(0)),
    );
}

function localTimeFor(timeZone: string, now: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(now);
}

export default definePlugin({
  metadata: {
    id: "re.leob.TheirTime",
    name: "Their time",
    version: "1.0.0",
    author: "Leonhard Breuer",
    description: "See local times of friends across timezones",
    icon: Icon.sfSymbol("globe.badge.clock"),
    permissions: [],
    settings: [
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
        const people: TheirTimeUser[] = Array.isArray(ctx.settings.people)
          ? (ctx.settings.people as TheirTimeUser[])
          : [];

        if (people.length === 0) {
          return [
            {
              id: "empty",
              title: "Add people in settings",
              subtitle:
                "Open Their Time settings to add names, X usernames, and locations",
              icon: Icon.sfSymbol("person.crop.circle.badge.plus"),
            },
          ];
        }

        const now = new Date(ctx.now);

        return people.map((person) => {
          const username = person.xUsername.replace(/^@/, "");
          const timeZone = resolveTimeZone(person);
          const timeStr = timeZone ? localTimeFor(timeZone, now) : "--:--";
          const locationStr = person.location || "";
          const subtitleParts = [];
          if (username) subtitleParts.push(`@${username}`);
          if (locationStr) subtitleParts.push(locationStr);

          const avatarIcon = username
            ? Icon.rounded(Icon.url(
                `https://unavatar.io/x/${encodeURIComponent(username)}`,
              ))
            : Icon.sfSymbol("person.crop.circle");

          const countryCode = resolveCountryCode(person);
          const badgeIcon = countryCode
            ? Icon.emoji(countryCodeToFlag(countryCode))
            : Icon.emoji("🌐");

          return {
            id: person.name.toLowerCase().replace(/\s+/g, "-"),
            title: person.name,
            subtitle: subtitleParts.join(" · "),
            icon: Icon.withBadge(avatarIcon, badgeIcon),
            accessory: Accessory.text(timeStr),
          };
        });
      },
    }),
  ],
});
