import { useState, useEffect, useRef } from "react";
import { z } from "zod";

const CastIdSchema = z.object({
	fid: z.number(),
	hash: z.string(),
	hubEventId: z.number(),
});
type CastIdType = z.infer<typeof CastIdSchema>;

type PageOptionType = {
	pageSize?: number;
	pageToken?: string;
	reverse?: boolean;
};

const DEFAULT_HUB_HTTP = "https://20eef7.hubs.neynar.com:2281";

export const useFetchData = (
	url: string,
	dependencies: (string | number)[],
) => {
	const [data, setData] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);

	useEffect(() => {
		setIsLoading(true);
		setIsError(false);

		const fetchData = async () => {
			try {
				const response = await fetch(url);
				const result = await response.json();
				setData(result);
			} catch (error) {
				setIsError(true);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, dependencies);

	return [data, isError, isLoading];
};

export const useUser = (params: { fid: number; hubHTTP?: string }) => {
	const hookHubHTTP = params.hubHTTP || DEFAULT_HUB_HTTP;
	return useFetchData(`${hookHubHTTP}/v1/userDataByFid?fid=${params.fid}`, [
		params.fid,
		hookHubHTTP,
	]);
};

export const useCastById = (params: {
	fid: number;
	hash: string;
	hubHTTP?: string;
}) => {
	const hookHubHTTP = params.hubHTTP || DEFAULT_HUB_HTTP;
	return useFetchData(
		`${hookHubHTTP}/v1/castById?fid=${params.fid}&hash=${params.hash}`,
		[params.fid, params.hash, hookHubHTTP],
	);
};

export const useCastsByFid = (params: {
	fid: number;
	pageOption?: PageOptionType;
	hubHTTP?: string;
}) => {
	const hookHubHTTP = params.hubHTTP || DEFAULT_HUB_HTTP;

	let queryParams = `fid=${params.fid}`;
	if (params?.pageOption?.pageSize)
		queryParams += `&pageSize=${params.pageOption.pageSize}`;
	if (params?.pageOption?.pageToken)
		queryParams += `&pageToken=${params.pageOption.pageToken}`;
	if (params?.pageOption?.reverse)
		queryParams += `&reverse=${params.pageOption.reverse}`;

	return useFetchData(`${hookHubHTTP}/v1/castsByFid?${queryParams}`, [
		params.fid,
		hookHubHTTP,
	]);
};

export const useCastsByParent = (params: {
	fid: number;
	hash: string;
	pageOption?: PageOptionType;
	hubHTTP?: string;
}) => {
	const hookHubHTTP = params.hubHTTP || DEFAULT_HUB_HTTP;

	let queryParams = `fid=${params.fid}&hash=${params.hash}`;
	if (params?.pageOption?.pageSize)
		queryParams += `&pageSize=${params.pageOption.pageSize}`;
	if (params?.pageOption?.pageToken)
		queryParams += `&pageToken=${params.pageOption.pageToken}`;
	if (params?.pageOption?.reverse)
		queryParams += `&reverse=${params.pageOption.reverse}`;

	return useFetchData(`${hookHubHTTP}/v1/castsByParent?${queryParams}`, [
		params.fid,
		params.hash,
		hookHubHTTP,
	]);
};

export const useListenCast = (url = "http://localhost:3000/listen") => {
	const [data, setData] = useState(null);
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
					console.log(result);
					setData(result);

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
