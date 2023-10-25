import { getSSLHubRpcClient, HubEventType } from "@farcaster/hub-nodejs";
import { z } from "zod";
import { emitter, rollingLog } from "./shared";
import { BufferSchema, clog } from "@rinza/utils";
import base64 from "base-64";
import utf8 from "utf8";

const eventHandler = (event: unknown) => {
	clog("eventHandler/event", event);

	const parsed = {
		hubEventId: z.number().parse(event.id),
		hash: BufferSchema.parse(event.mergeMessageBody.message.hash),
		fid: z.number().parse(event.mergeMessageBody.message.data.fid),
		type: z.number().parse(event.mergeMessageBody.message.data.type),
		timestamp: z.number().parse(event.mergeMessageBody.message.data.timestamp),
		raw: base64.encode(utf8.encode(JSON.stringify(event))),
	};

	rollingLog.appendLine(parsed);
	emitter.emit("all-event", parsed);
};

const hubRpcEndpoint = "20eef7.hubs.neynar.com:2283";
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
	if (e) {
		console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
	}

	const subscribeResult = await client.subscribe({
		eventTypes: [HubEventType.MERGE_MESSAGE],
	});

	if (subscribeResult.isErr()) {
		console.error("Failed to subscribe to events:", subscribeResult.error);
		process.exit(1);
	}

	clog(
		"connect/successful",
		`Connected to ${hubRpcEndpoint}, listening for events`,
	);

	const stream = subscribeResult.value;
	for await (const event of stream) {
		clog("connect/event", event);
		eventHandler(event);
	}
	client.close();
});
