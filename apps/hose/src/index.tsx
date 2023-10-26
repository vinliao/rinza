import { createRoot } from "react-dom/client";
import { useEvents } from "@rinza/farcaster-hooks";
import { z } from "zod";
import utf8 from "utf8";
import base64 from "base-64";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

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
		<ScrollArea className="h-[200px] w-[600px] border p-4">
			<Table className="w-full">
				<TableBody>
					{Array.isArray(data) &&
						data.map((event, index) => (
							<TableRow key={event.hubEventId || index}>
								<TableCell className="font-medium">
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
