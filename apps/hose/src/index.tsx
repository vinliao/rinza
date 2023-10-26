import { createRoot } from "react-dom/client";
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
	const [data, isError, isLoading] = useEvents({ shouldListen: true });

	return (
		<ScrollArea className="h-screen w-[600px] border p-2">
			<Table className="w-full">
				<TableBody>
					{Array.isArray(data) &&
						data.map((event, index) => (
							<TableRow key={event.hubEventId || index}>
								<TableCell>
									<Badge variant={"secondary"} className="pl-0 pr-1 font-mono">
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
	);
};

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
