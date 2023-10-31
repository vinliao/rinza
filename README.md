# rinza

TypeScript libraries for real-time Farcaster apps.

## TLDR:

`npm i @rinza/farcaster-hooks`

```tsx
import { useEvents } from "@rinza/farcaster-hooks";

const [data, isError, isLoading] = useEvents();
data.map((event) => (
	<tr key={event.hubEventId}>
		<td>{event.description}</td>
	</tr>
));
```

Demo: [https://rinza.org](https://rinza.org)

## Why?
Real-time Farcaster data is nice, but spinning up a custom websocket server is annoying.

This monorepo contains:
- A websocket server that sends real-time Farcaster
- A React hook that wraps the websocket server
- A TypeScript bot framework (WIP)

What Rinza does not provide:
- Fetching functionalities (eg. getCastById, getUser)
- Writing functionalities (eg. message construction, writing to Hub)
- Use this instead: [https://github.com/standard-crypto/farcaster-js](https://github.com/standard-crypto/farcaster-js)

Reach me at: [warpcast.com/pixel](https://warpcast.com/pixel) or [t.me/pixel6861636b](https://t.me/pixel6861636b)