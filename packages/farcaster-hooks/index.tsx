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
 *
 * @returns TODO
 *
 * @example
 * ```
 * const events = useEvents();
 * ```
 */
export const useListenEvents = ({
	notifierURL = "https://rinza-notifier.up.railway.app",
} = {}) => {
	const [event, setEvent] = useState<NotifierEventType | null>(null);
	const [status, setStatus] = useState<
		"connecting" | "reconnecting" | "connected" | "disconnected"
	>("connecting");
	const socketRef = useRef<Socket | null>(null);

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
			setEvent(parsed);
		});

		// cleanup
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
				setStatus("disconnected");
			}
		};
	}, [notifierURL]);

	return {
		event,
		status,
		isConnecting,
		isReconnecting,
		isConnected,
		isDisconnected,
	};
};

/**
 * useRecentEvents() Hook
 *
 * Fetches recent events.
 *
 * @param {object} options - Hook config.
 * @param {string} options.notifierURL - Notifier URL,
 * @param {number} options.maxItems - Max number of items to keep in the list.
 *
 * @returns TODO
 *
 * @example
 * ```
 * const { result, isFetched } = useRecentEvents();
 * ```
 *
 * TODO:
 * - cursor?
 */
export const useRecentEvents = ({
	notifierURL = "https://rinza-notifier.up.railway.app",
	maxItems = 25, // min 25, max 100
} = {}) => {
	const [result, setResult] = useState<NotifierEventType[]>([]);
	const [status, setStatus] = useState<
		"idle" | "fetching" | "fetched" | "error"
	>("idle");

	const isFetching = status === "fetching";
	const isFetched = status === "fetched";
	const isError = status === "error";

	useEffect(() => {
		const fetchData = async () => {
			setStatus("fetching");
			try {
				const url = `${notifierURL}/logs?limit=${maxItems}`;
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				setResult(data);
				setStatus("fetched");
			} catch (error) {
				console.error("Fetching error:", error);
				setStatus("error");
			}
		};

		fetchData();
	}, [notifierURL, maxItems]);

	return {
		result,
		status,
		isFetching,
		isFetched,
		isError,
	};
};

/**
 * ideas:
 * - useFname
 * - useFid
 * - useHubEventId
 * - useHubEventIdFrom
 * - useCasts
 */
