import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { z } from "zod";
import utf8 from "utf8";
import base64 from "base-64";

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

// TODO: move this to utils, but figure out the Buffer bug first
export const encodeBase64 = (obj: object) => {
	return base64.encode(utf8.encode(JSON.stringify(obj)));
};

export const parseBase64 = (raw: string) => {
	return JSON.parse(utf8.decode(base64.decode(raw)));
};

/**
 * useEvents() Hook
 *
 * Listens to incoming events from Hub.
 *
 * @param {object} options - Hook config.
 * @param {string} options.notifierURL - Notifier URL,
 * @param {number} options.maxItems - Max number of items to keep in the list.
 *
 * @returns TODO
 *
 * @example
 * ```
 * const data = useEvents();
 * ```
 */
export const useEvents = ({
	notifierURL = "https://rinza-notifier.up.railway.app",
	maxItems = 100,
} = {}) => {
	const [data, setData] = useState<NotifierEventType[]>([]);
	const [status, setStatus] = useState<
		"connecting" | "reconnecting" | "connected" | "disconnected"
	>("connecting");
	const socketRef = useRef<Socket | null>(null);

	// Derive boolean values from the status
	const isConnecting = status === "connecting";
	const isReconnecting = status === "reconnecting";
	const isConnected = status === "connected";
	const isDisconnected = status === "disconnected";

	useEffect(() => {
		socketRef.current = io(notifierURL);

		socketRef.current.on("connect", () => {
			console.log("Socket.io connection established");
			setStatus("connected");
		});

		socketRef.current.on("disconnect", () => {
			console.log("Socket.io connection disconnected");
			setStatus("disconnected");
		});

		socketRef.current.on("reconnect_attempt", () => {
			console.log("Socket.io attempting to reconnect");
			setStatus("reconnecting");
		});

		socketRef.current.on("connect_error", (error: Error) => {
			console.log("Socket.io connection error:", error);
			setStatus("disconnected");
		});

		socketRef.current.on("merge-message", (eventData: string) => {
			const parsedTry = NotifierEventSchema.safeParse(JSON.parse(eventData));
			if (!parsedTry.success) {
				console.error("Data parsing error:", parsedTry.error);
				return;
			}
			const parsed = parsedTry.data;
			setData((prevData) => [parsed, ...prevData].slice(0, maxItems));
		});

		// cleanup
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
				setStatus("disconnected");
			}
		};
	}, [notifierURL, maxItems]);

	return {
		data,
		status,
		isConnecting,
		isReconnecting,
		isConnected,
		isDisconnected,
	};
};

// useRecentEvents, literally just the recent EventSource,
// from hubEventId, literallywrapper around
// useRecentEvents = 2281/v1/events?from_event_id=350909155450880

// export const useCasts = ({
// 	notifierURL = "https://rinza-notifier.up.railway.app",
// 	maxItems = 100,
// 	includeFids = [-1], // -1 means include all
// 	includeMentions = [-1], // -1 means include all
// 	includeParentFid = [-1], // -1 means include all
// 	includeParentUrl = [-1], // -1 means include all
// } = {}) => {
// 	const [data, setData] = useState<NotifierEventType[]>([]);
// 	const [isLoading, setIsLoading] = useState(false);
// 	const [isError, setIsError] = useState(false);
// 	const socketRef = useRef<Socket | null>(null);

// 	// if both are defined, it's AND operation
// 	const includeFidsRef = useRef(includeFids);

// 	const includeMessageTypesRef = useRef(includeMessageTypes);

// 	useEffect(() => {
// 		includeFidsRef.current = includeFids;
// 		includeMessageTypesRef.current = includeMessageTypes;
// 	}, [includeFids, includeMessageTypes]);

// 	useEffect(() => {
// 		setIsLoading(true);
// 		socketRef.current = io(notifierURL);
// 		socketRef.current.on("connect", () => {
// 			console.log("Socket.io connection established");
// 		});

// 		socketRef.current.on("initial-logs", (initialLogs: string) => {
// 			const rawLogs = JSON.parse(initialLogs);
// 			const parsedTry = z.array(NotifierEventSchema).safeParse(rawLogs);
// 			if (!parsedTry.success) {
// 				console.error("Data parsing error:", parsedTry.error);
// 				setIsError(true);
// 				return;
// 			}
// 			const parsed = parsedTry.data;
// 			setData((prevData) => [...parsed, ...prevData].slice(0, maxItems));
// 			setIsLoading(false);
// 		});

// 		socketRef.current.on("connect_error", (error: Error) => {
// 			console.log("Socket.io connection error:", error);
// 			setIsError(true);
// 		});

// 		const eventHandler = (eventData: string) => {
// 			const parsedTry = NotifierEventSchema.safeParse(JSON.parse(eventData));
// 			if (!parsedTry.success) {
// 				console.error("Data parsing error:", parsedTry.error);
// 				setIsError(true);
// 				return;
// 			}
// 			const parsed = parsedTry.data;
// 			setData((prevData) => [parsed, ...prevData].slice(0, maxItems));
// 		};

// 		const includeAllFids = includeFidsRef.current.includes(-1);
// 		const includeAllMessageTypes = includeMessageTypesRef.current.includes(-1);
// 		const includeAll = includeAllFids && includeAllMessageTypes;

// 		// listen to specific events based on the include* props
// 		if (includeAll) socketRef.current.on("merge-message", eventHandler);
// 		else if (includeAllFids && !includeAllMessageTypes) {
// 			for (const messageType of includeMessageTypesRef.current) {
// 				socketRef.current.on(`merge-message-type-${messageType}`, eventHandler);
// 			}
// 		} else if (!includeAllFids && includeAllMessageTypes) {
// 			for (const fid of includeFidsRef.current) {
// 				socketRef.current.on(`merge-message-fid-${fid}`, eventHandler);
// 			}
// 		} else if (!includeAllFids && !includeAllMessageTypes) {
// 			for (const messageType of includeMessageTypesRef.current) {
// 				for (const fid of includeFidsRef.current) {
// 					socketRef.current.on(
// 						`merge-message-fid-${fid}-type-${messageType}`,
// 						eventHandler,
// 					);
// 				}
// 			}
// 		}

// 		// cleanup
// 		return () => {
// 			if (socketRef.current) {
// 				socketRef.current.disconnect();
// 			}
// 		};
// 	}, [notifierURL, maxItems]);

// 	return { data, isError, isLoading };
// };

// // TODO:
// // export const useTrending = () => {};
