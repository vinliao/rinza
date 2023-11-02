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

// raw: base64.encode(utf8.encode(JSON.stringify(parsed))),
// above is encoded code
const parseRaw = (raw: string) => {};

// TODO: hubHTTPURL
// TODO: maybe there's a better API than [-1] for "all"
export const useEvents = ({
	notifierURL = "https://rinza-notifier.up.railway.app",
	maxItems = 100,
	includeFids = [-1], // -1 means include all
	includeMessageTypes = [-1], // -1 means include all
} = {}) => {
	const [data, setData] = useState<NotifierEventType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const socketRef = useRef<Socket | null>(null);

	// if both are defined, it's AND operation
	const includeFidsRef = useRef(includeFids);
	const includeMessageTypesRef = useRef(includeMessageTypes);

	useEffect(() => {
		includeFidsRef.current = includeFids;
		includeMessageTypesRef.current = includeMessageTypes;
	}, [includeFids, includeMessageTypes]);

	useEffect(() => {
		setIsLoading(true);
		socketRef.current = io(notifierURL);
		socketRef.current.on("connect", () => {
			console.log("Socket.io connection established");
		});

		socketRef.current.on("initial-logs", (initialLogs: string) => {
			const rawLogs = JSON.parse(initialLogs);
			const parsedTry = z.array(NotifierEventSchema).safeParse(rawLogs);
			if (!parsedTry.success) {
				console.error("Data parsing error:", parsedTry.error);
				setIsError(true);
				return;
			}
			const parsed = parsedTry.data;
			setData((prevData) => [...parsed, ...prevData].slice(0, maxItems));
			setIsLoading(false);
		});

		socketRef.current.on("connect_error", (error: Error) => {
			console.log("Socket.io connection error:", error);
			setIsError(true);
		});

		const eventHandler = (eventData: string) => {
			const parsedTry = NotifierEventSchema.safeParse(JSON.parse(eventData));
			if (!parsedTry.success) {
				console.error("Data parsing error:", parsedTry.error);
				setIsError(true);
				return;
			}
			const parsed = parsedTry.data;
			setData((prevData) => [parsed, ...prevData].slice(0, maxItems));
		};

		if (
			includeFidsRef.current.includes(-1) &&
			includeMessageTypesRef.current.includes(-1)
		) {
			socketRef.current.on("merge-message", eventHandler);
		} else if (
			includeFidsRef.current.includes(-1) &&
			!includeMessageTypesRef.current.includes(-1)
		) {
			for (const messageType of includeMessageTypesRef.current) {
				socketRef.current.on(`merge-message-type-${messageType}`, eventHandler);
			}
		} else if (
			includeMessageTypesRef.current.includes(-1) &&
			!includeFidsRef.current.includes(-1)
		) {
			for (const fid of includeFidsRef.current) {
				socketRef.current.on(`merge-message-fid-${fid}`, eventHandler);
			}
		} else if (
			!includeMessageTypesRef.current.includes(-1) &&
			!includeFidsRef.current.includes(-1)
		) {
			for (const messageType of includeMessageTypesRef.current) {
				for (const fid of includeFidsRef.current) {
					socketRef.current.on(
						`merge-message-fid-${fid}-type-${messageType}`,
						eventHandler,
					);
				}
			}
		}

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
