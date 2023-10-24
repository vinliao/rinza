import { useState, useEffect, useRef } from "react";
import { z } from "zod";
// import { NotifierEventSchema, NotifierEventType } from "@rinza/utils";

export const NotifierEventSchema = z.object({
	hubEventId: z.number(),
	hash: z.string(),
	fid: z.number(),
	type: z.number(),
	timestamp: z.number(),
});
export type NotifierEventType = z.infer<typeof NotifierEventSchema>;

export const useFetchRecent = (url = "http://localhost:3000/recent-events") => {
	const [data, setData] = useState<NotifierEventType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);

	useEffect(() => {
		setIsLoading(true);
		setIsError(false);

		const fetchData = async () => {
			try {
				const response = await fetch(url);
				const result = await response.json();
				const parsed = z.array(NotifierEventSchema).parse(result);
				setData(parsed);
			} catch (error) {
				setIsError(true);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [url]);

	return [data, isError, isLoading];
};

export const useListenEvent = (url = "http://localhost:3000/listen") => {
	const [data, setData] = useState<NotifierEventType | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const shouldPoll = useRef(true);

	useEffect(() => {
		setIsLoading(true);

		const fetchData = async () => {
			while (shouldPoll.current) {
				try {
					const response = await fetch(url);
					if (!response.ok) throw new Error("Network response was not ok");
					const result = await response.json();
					const parsed = NotifierEventSchema.parse(result);
					setData(parsed);

					// Introduce a delay before the next fetch
					await new Promise((res) => setTimeout(res, 1000));
				} catch (error) {
					setIsError(true);
					shouldPoll.current = false;
				}
			}
			setIsLoading(false);
		};

		fetchData();

		return () => {
			shouldPoll.current = false;
		};
	}, [url]);

	return [data, isError, isLoading];
};

export const useEvents = (
	url = "http://localhost:3000",
	shouldListen = false,
) => {
	const [data, setData] = useState<NotifierEventType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const shouldPoll = useRef(shouldListen);

	useEffect(() => {
		setIsLoading(true);

		const fetchData = async () => {
			try {
				const response = await fetch(`${url}/recent-events`);
				const result = await response.json();
				const parsed = z.array(NotifierEventSchema).parse(result);
				setData(parsed);
			} catch (error) {
				setIsError(true);
			} finally {
				setIsLoading(false);
			}
		};

		const fetchListenData = async () => {
			while (shouldPoll.current) {
				try {
					const response = await fetch(`${url}/listen`);
					if (!response.ok) throw new Error("Network response was not ok");
					const result = await response.json();
					const parsed = NotifierEventSchema.parse(result);
					setData((prevData) => [...prevData, parsed]);
					await new Promise((res) => setTimeout(res, 1000));
				} catch (error) {
					setIsError(true);
					shouldPoll.current = false;
				}
			}
			setIsLoading(false);
		};

		fetchData();
		if (shouldListen) {
			fetchListenData();
		}

		return () => {
			shouldPoll.current = false;
		};
	}, [url, shouldListen]);

	return [data, isError, isLoading];
};
