import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { useListenCast } from "../dist";

// a place to manually test the hooks
const App = () => {
	const fid = 4640;
	const hash = "0x6fa14e4047bdf1181851537b062e4efbfddd3306";
	const pageOption = { pageSize: 5 };
	// const [data, isError, isLoading] = useUser({ fid });
	// const [data, isError, isLoading] = useCastById({ fid, hash });
	// const [data, isError, isLoading] = useCastsByFid({ fid, pageOption });
	// const [data, isError, isLoading] = useCastsByParent({
	// 	fid,
	// 	hash,
	// 	pageOption,
	// });
	const [casts, setCasts] = useState([]);

	const [data, isError, isLoading] = useListenCast();

	// dummy code
	useEffect(() => {
		if (data) {
			setCasts((prevDataList) => [...prevDataList, data]);
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
					{casts.map((cast) => (
						<li key={cast.hubEventId}>{JSON.stringify(cast)}</li>
					))}
				</ul>
			</div>
		</div>
	);
};

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
