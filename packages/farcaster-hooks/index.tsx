import { useState, useEffect, useRef } from "react";
import { z } from "zod";

// const CastIdSchema = z.object({
// 	fid: z.number(),
// 	hash: z.string(),
// 	hubEventId: z.number(),
// });
// type CastIdType = z.infer<typeof CastIdSchema>;

// type PageOptionType = {
// 	pageSize?: number;
// 	pageToken?: string;
// 	reverse?: boolean;
// };

// const DEFAULT_HUB_HTTP = "https://20eef7.hubs.neynar.com:2281";

const NotifierEventSchema = z.object({
	hubEventId: z.number(),
	hash: z.string(),
	fid: z.number(),
	type: z.number(),
  timestamp: z.number(),
});
type NotifierEventType = z.infer<typeof NotifierEventSchema>;

export const useListenCast = (url = "http://localhost:3000/listen") => {
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