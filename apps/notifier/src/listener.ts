import { getSSLHubRpcClient, HubEventType } from "@farcaster/hub-nodejs";
import { z } from "zod";
import emitter from "./emitter";
import { BufferSchema, clog } from "@rinza/utils";

const eventHandler = (event: unknown) => {
	clog("linkAddHandler/event", event);

	const hubEventId = z.number().parse(event.id);
	const hash = BufferSchema.parse(event.mergeMessageBody.message.hash);
	const fid = z.number().parse(event.mergeMessageBody.message.data.fid);
	const type = z.number().parse(event.mergeMessageBody.message.data.type);
	emitter.emit("all-event", { hubEventId, hash, fid, type });
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
