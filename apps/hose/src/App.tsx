import { useEvents } from "@rinza/farcaster-hooks";
import { z } from "zod";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import logSnapshot from "./logSnapshot";

const messageTypeMap = new Map([
	[0, "NONE"],
	[1, "CAST"],
	[2, "CAST_REMOVE"],
	[3, "REACTION"],
	[4, "REACTION_REMOVE"],
	[5, "LINK"],
	[6, "LINK_REMOVE"],
	[7, "VERIFICATION"],
	[8, "VERIFICATION_REMOVE"],
	// [9, "SIGNER_ADD"],
	// [10, "SIGNER_REMOVE"],
	[11, "USER_DATA"],
	[12, "USERNAME_PROOF"],
]);

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

const Introduction = () => {
	return (
		<div>
			<p>Rinza is a TypeScript lib for building real-time Farcaster apps.</p>
			<p>It provides React hooks. (Bot framework WIP.)</p>
			<p>
				TLDR:{" "}
				<code className="font-bold bg-gray-100 px-1">
					{"const data = useEvents();"}
				</code>
			</p>
			<p>Real-time Farcaster messages in your React app.</p>
			<p>
				Docs:{" "}
				<a
					href="https://github.com/vinliao/rinza"
					target="_blank"
					rel="noreferrer"
					className="underline"
				>
					github.com/vinliao/rinza
				</a>
			</p>
			<p>
				Reach me at:{" "}
				<a
					href="https://warpcast.com/pixel"
					target="_blank"
					rel="noreferrer"
					className="underline"
				>
					warpcast.com/pixel
				</a>{" "}
				or{" "}
				<a
					href="https://t.me/pixel6861636b"
					target="_blank"
					rel="noreferrer"
					className="underline"
				>
					t.me/pixel6861636b
				</a>
			</p>
		</div>
	);
};

const TableHeaderGreen = ({
	latestHubEventId,
}: { latestHubEventId?: number }) => (
	<div className="flex items-baseline space-x-2 mb-3">
		<span className="font-mono">Live events</span>
		<span className="relative flex h-2 w-2">
			<span className="animate-ping absolute inline-flex h-full w-full bg-lime-400 opacity-75 rounded-full" />
			<span className="relative inline-flex h-2 w-2 bg-lime-500 rounded-full" />
		</span>
		<div className="flex-1" />
		{latestHubEventId !== undefined && (
			<span>Event ID tip: {latestHubEventId}</span>
		)}
	</div>
);

const TableHeaderRed = ({
	latestHubEventId,
}: { latestHubEventId?: number }) => (
	<div className="flex items-baseline space-x-2 mb-3">
		<span className="font-mono">Live events</span>
		<span className="relative flex h-2 w-2">
			<span className="animate-ping absolute inline-flex h-full w-full bg-orange-400 opacity-75 rounded-full" />
			<span className="relative inline-flex h-2 w-2 bg-orange-500 rounded-full" />
		</span>
		<div className="flex-1" />
		{latestHubEventId !== undefined && (
			<span>Event ID tip: {latestHubEventId}</span>
		)}
	</div>
);

const LiveCasts = ({ data }: { data: NotifierEventType[] }) => (
	<TableBody>
		{Array.isArray(data) &&
			data.map((event, index) => (
				<TableRow key={event.hubEventId || index}>
					<TableCell>
						<Badge
							variant={"secondary"}
							className="px-0.5 mr-1 font-mono font-bold"
						>
							{messageTypeMap.get(event.type)}
						</Badge>
						{event.description}
					</TableCell>
				</TableRow>
			))}
	</TableBody>
);

function shuffleArray<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

const App = () => {
	const { data, isConnected } = useEvents({
		notifierURL: "https://rinza-notifier.up.railway.app",
		maxItems: 100,
	});
	const latestHubEventId =
		Array.isArray(data) && data.length > 0 ? data[0].hubEventId : undefined;

	return (
		<div className="p-2 max-w-lg h-screen flex flex-col space-y-3">
			<Introduction />
			<ScrollArea className="border p-2">
				{isConnected ? (
					<Table className="w-full">
						<TableHeaderGreen latestHubEventId={latestHubEventId} />
						<LiveCasts data={data} />
					</Table>
				) : (
					<Table className="w-full">
						<TableHeaderRed latestHubEventId={latestHubEventId} />
						<LiveCasts data={shuffleArray(logSnapshot)} />
					</Table>
				)}
				{/* {isError && <div className="text-center text-red-500">Error</div>} */}
			</ScrollArea>
		</div>
	);
};

export default App;
