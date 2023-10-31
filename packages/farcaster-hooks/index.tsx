import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { z } from "zod";

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

export const useEvents = ({
	url = "https://rinza-notifier.up.railway.app",
	maxItems = 250,
} = {}) => {
	const [data, setData] = useState<NotifierEventType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		setIsLoading(true);
		socketRef.current = io(url);

		socketRef.current.on("initialLogs", (initialLogs: string) => {
			const parsedLogs = JSON.parse(initialLogs);
			setData((prevData) => [...parsedLogs, ...prevData].slice(0, maxItems));
			setIsLoading(false);
		});

		socketRef.current.on("connect", () => {
			console.log("Socket.io connection established");
			setIsLoading(false);
		});

		socketRef.current.on("connect_error", (error: Error) => {
			console.log("Socket.io connection error:", error);
			setIsError(true);
		});

		socketRef.current.on("event", (eventData: string) => {
			const parsedTry = NotifierEventSchema.safeParse(JSON.parse(eventData));
			if (!parsedTry.success) {
				console.error("Data parsing error:", parsedTry.error);
				setIsError(true);
				return;
			}
			const parsed = parsedTry.data;
			setData((prevData) => [parsed, ...prevData].slice(0, maxItems));
		});

		// cleanup
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, [url, maxItems]);

	return { data, isError, isLoading };
};

// TODO:
// export const useTrending = () => {};
