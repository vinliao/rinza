import { z } from "zod";
import { getSSLHubRpcClient, HubEventType } from "@farcaster/hub-nodejs";
import emitter from "./emitter";
import { clog, EventSchema } from "@rinza/utils";

// TODO: handle event type > 1
const eventHandler = (event: unknown) => {
	const parsed = EventSchema.parse(event);
	const castAddBody = parsed.mergeMessageBody.message.data.castAddBody;
	const replyMentionFids = [
		castAddBody.parentCastId?.fid,
		...castAddBody.mentions,
	];
	clog("eventHandler/parsed", parsed);

	for (const fid of replyMentionFids) {
		clog("eventHandler/fid", fid);

		emitter.emit(`reply-mention-${fid}`, {
			hubEventId: parsed.id,
			hash: parsed.mergeMessageBody.message.hash,
			fid: parsed.mergeMessageBody.message.data.fid,
		});

		emitter.emit("all-cast", {
			hubEventId: parsed.id,
			hash: parsed.mergeMessageBody.message.hash,
			fid: parsed.mergeMessageBody.message.data.fid,
		});
	}
};

const hubRpcEndpoint = "nemes.farcaster.xyz:2283";
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
		if (event.mergeMessageBody.message.data.type === 1) eventHandler(event);
	}
	client.close();
});
