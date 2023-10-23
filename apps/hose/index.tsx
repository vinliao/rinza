import { useState, useEffect } from "react";
import { z } from "zod";
import { createRoot } from "react-dom/client";
import { useListenCast } from "@rinza/farcaster-hooks";

// TODO: messages/minute
const App = () => {
  // 
	const fid = 4640;
	const hash = "0x6fa14e4047bdf1181851537b062e4efbfddd3306";

	const NotifierEventSchema = z.object({
		hubEventId: z.number(),
		hash: z.string(),
		fid: z.number(),
		type: z.number(),
    timestamp: z.number(),
	});
	type NotifierEventType = z.infer<typeof NotifierEventSchema>;
	const [events, setEvents] = useState<NotifierEventType[]>([]);
	const [data, isError, isLoading] = useListenCast();

  // biome-ignore lint: false positive
	useEffect(() => {
		if (data) {
			const parsed = NotifierEventSchema.parse(data);
			setEvents((prevDataList) => [...prevDataList, parsed]);
		}
	}, [data]);

	return (
		<div>
			<p>user!</p>
			{/* TODO: this page should test all the hooks, display all the stuff */}
			{isLoading && <div>Loading...</div>}
			{isError && <div>Error</div>}
			{data && <div>Latest Event: {JSON.stringify(data)}</div>}
			<div>
				<h3>All Events:</h3>
				<ul>
					{events.map((event) => (
						<li key={event.hubEventId}>{JSON.stringify(event)}</li>
					))}
				</ul>
			</div>
		</div>
	);
};

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
