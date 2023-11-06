# rinza

TypeScript libraries for real-time Farcaster apps. It provides a React hooks and a bot framework.

## TLDR:

**React hooks: `npm i @rinza/farcaster-hooks`**

```tsx
import { useEvents } from "@rinza/farcaster-hooks";

const App = () => {
  // real-time events from Hub
  const { event } = useListenEvent({ notifierURL });
  return <span>{event.description}</span>;
};
```

Demo: [https://rinza.org](https://rinza.org)

**Bot framework: `npm i @rinza/farcaster-bot`**

```ts
import { makeBot } from "@rinza/farcaster-bot";

// sends POST message to Neynar's write API
const poster = neynarPoster(apiKey, neynarSigner);
const bot = makeBot({ fid: 4640 });
  
// replies with "Echo!" to every reply and mention
bot.onmessage((ctx) => {
  poster('Echo!', ctx.parentHash);
});
```

## Why?

Real-time Farcaster data is nice, but spinning up a custom websocket server is annoying.

This monorepo contains:

- A websocket server that sends real-time Farcaster (see: [apps/notifier](./apps/notifier/))
- A React hook that wraps the websocket server (see: [packages/farcaster-hooks](./packages/farcaster-hooks/))
- A bot framework (see: [packages/farcaster-bot](./packages/farcaster-bot/))

What Rinza does not provide:

- Fetching functionalities (eg. getCastById, getUser)
- Writing functionalities (eg. message construction, writing to Hub)
- Use this instead: [https://github.com/standard-crypto/farcaster-js](https://github.com/standard-crypto/farcaster-js)

## APIs

**`useEvents()`**

Hook to listen for real-time Farcaster events from Hub.

### Usage

```tsx
import { useEvents, parseRaw } from "@rinza/farcaster-hooks";

const App = () => {
  const { data, isError, isLoading } = useEvents({
    notifierURL: "https://rinza-notifier.up.railway.app",
    maxItems: 100,
    includeFids: [2, 3], // by default: include all fids
    includeMessageTypes: [1, 3], // by default: include all message types
  });
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error!</p>;
  return (
    <div>
      {data.map((event) => (
        <span key={event.hubEventId}>{event.description}</span>
        <span key={event.hubEventId}>{parseRaw(event.raw)}</span>
      ))}
    </div>
  );
}
```

### Return value

```ts
{
  hubEventId: number,
  hash: string,
  fid: number,
  type: number,
  timestamp: number, // unix ms
  description: string, // one sentence description of the event
  raw: string // base64 encoded string of raw messages from Hub
}
```

**`useCasts()`** (WIP)

Hook to listen for real-time casts from Hub.

**`useTrending()`** (WIP)

Hook for fetching trending casts.

Reach me at: [warpcast.com/pixel](https://warpcast.com/pixel) or [t.me/pixel6861636b](https://t.me/pixel6861636b)
