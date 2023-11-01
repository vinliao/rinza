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

// TODO: hubHTTPURL
// TODO: maybe there's a better API than [-1] for "all"
export const useEvents = ({
	notifierURL = "https://rinza-notifier.up.railway.app",
	maxItems = 100,
	includeFids = [-1], // -1 means all
	includeMessageTypes = [-1], // -1 means all
} = {}) => {
	const [data, setData] = useState<NotifierEventType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const socketRef = useRef<Socket | null>(null);

	const includeFidsRef = useRef(includeFids);
	const includeMessageTypesRef = useRef(includeMessageTypes);

	useEffect(() => {
		includeFidsRef.current = includeFids;
		includeMessageTypesRef.current = includeMessageTypes;
	}, [includeFids, includeMessageTypes]);

	useEffect(() => {
		setIsLoading(true);
		socketRef.current = io(notifierURL);
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
				// TODO: log somewhere
				console.error("Data parsing error:", parsedTry.error);
				setIsError(true);
				return;
			}
			const parsed = parsedTry.data;

			// filter the events
			if (
				!includeFidsRef.current.includes(-1) &&
				!includeFidsRef.current.includes(parsed.fid)
			)
				return;

			if (
				!includeMessageTypesRef.current.includes(-1) &&
				!includeMessageTypesRef.current.includes(parsed.type)
			)
				return;

			setData((prevData) => [parsed, ...prevData].slice(0, maxItems));
		});

		// cleanup
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, [notifierURL, maxItems]);

	return { data, isError, isLoading };
};

// TODO:
// export const useTrending = () => {};
