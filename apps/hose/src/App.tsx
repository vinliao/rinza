import { useEvents } from "@rinza/farcaster-hooks";
import { z } from "zod";
import utf8 from "utf8";
import base64 from "base-64";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

const App = () => {
	const [data, isError, isLoading] = useEvents();
	const latestHubEventId =
		Array.isArray(data) && data.length > 0 ? data[0].hubEventId : undefined;

	return (
		<div className="p-2 max-w-lg h-screen flex flex-col space-y-3">
			<div>
				<p>Rinza is a TypeScript lib for building real-time Farcaster apps.</p>
				<p>It provides React hooks. (Bot framework WIP.)</p>
				<p>
					TLDR:{" "}
					<code className="font-bold">
						const [data, isError, isLoading] = useEvents()
					</code>
				</p>
				<p>Real-time Farcaster messages in your React app.</p>
				<p>Docs: github.com/tbd</p>
			</div>
			<ScrollArea className="border p-2">
				<Table className="w-full">
					<div className="flex items-baseline space-x-2 mb-3">
						{!isLoading && (
							<span className="font-mono">Listening live events</span>
						)}
						{!isLoading && (
							<span className="relative flex h-2 w-2">
								<span className="animate-ping absolute inline-flex h-full w-full bg-lime-400 opacity-75 rounded-full" />
								<span className="relative inline-flex h-2 w-2 bg-lime-500 rounded-full" />
							</span>
						)}
						<div className="flex-1" />
						{latestHubEventId && (
							<span>Latest hubEventId: {latestHubEventId}</span>
						)}
					</div>

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
				</Table>
				{isLoading && <div className="text-center">Loading...</div>}
				{isError && <div className="text-center text-red-500">Error</div>}
			</ScrollArea>
		</div>
	);
};

export default App;
