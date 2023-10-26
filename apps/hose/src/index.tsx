import { createRoot } from "react-dom/client";
import { useEvents } from "@rinza/farcaster-hooks";
import { z } from "zod";
import utf8 from "utf8";
import base64 from "base-64";
import { Button } from "@/components/ui/button";

export const NotifierEventSchema = z.object({
	hubEventId: z.number(),
	hash: z.string(),
	fid: z.number(),
	type: z.number(),
	timestamp: z.number(),
	description: z.string(),
	raw: z.string(),
});
export type NotifierEventType = z.infer<typeof NotifierEventSchema>;

const App = () => {
	const [data, isError, isLoading] = useEvents({ shouldListen: true });
	let lastEvent;
	if (Array.isArray(data) && data.length > 0) {
		lastEvent = data[data.length - 1];
		lastEvent = utf8.decode(base64.decode(lastEvent.raw));
	}

	return (
		<div>
			<p>user!</p>
			{isLoading && <div>Loading...</div>}
			{isError && <div>Error</div>}
			{data && <div>Latest Event: {lastEvent}</div>}
			<div>
				<h3>All Events:</h3>
				<Button>Click me</Button>
				<ul>
					{data.map((event, index) => (
						<li key={event.hubEventId || index}>{event.description}</li>
					))}
				</ul>
			</div>
		</div>
	);
};

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
