import { useState, useEffect, useRef } from "react";
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

// FIX: if not typed, data is boolean | NotifierEventType[]
export const useEvents = ({
	url = "http://localhost:3000",
	shouldListen = false,
}): [NotifierEventType[], boolean, boolean] => {
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
					setData((prevData) => [parsed, ...prevData]);
					// await new Promise((res) => setTimeout(res, 1000));
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
