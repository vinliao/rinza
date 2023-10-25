import { getSSLHubRpcClient, HubEventType } from "@farcaster/hub-nodejs";
import { emitter, rollingLog } from "./shared";
import { HubEventSchema, HubEventType as HET } from "@rinza/utils";
import base64 from "base-64";
import utf8 from "utf8";
import { appendFile } from "fs";

const clog = (where: string, data: unknown): void => {
	const stringify = (data: unknown): string => {
		if (data instanceof Map)
			return JSON.stringify(Array.from(data.entries()), null, 2);
		if (typeof data === "object") return JSON.stringify(data, null, 2);
		return String(data);
	};

	const timestamp = new Date().toISOString();
	const log = `${timestamp} - ${where} - ${stringify(data)}\n`;
	console.log(log);
	appendFile("./app.log", log, (err) => {
		console.log(err);
	});
};

const hubRpcEndpoint = "20eef7.hubs.neynar.com:2283";
const client = getSSLHubRpcClient(hubRpcEndpoint);

const eventHandler = async (event: HET) => {
	clog("eventHandler/event", event);

	const payload = {
		hubEventId: event.id,
		hash: event.mergeMessageBody.message.hash,
		fid: event.mergeMessageBody.message.data.fid,
		type: event.mergeMessageBody.message.data.type,
		timestamp: event.mergeMessageBody.message.data.timestamp,
		raw: base64.encode(utf8.encode(JSON.stringify(event))),
	};

	rollingLog.appendLine(payload);
	emitter.emit("all-event", payload);
};

client.$.waitForReady(Date.now() + 5000, async (e) => {
	if (e) {
		console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
	}

	const subscribeResult = await client.subscribe({
		eventTypes: [
			HubEventType.MERGE_MESSAGE,
			// HubEventType.PRUNE_MESSAGE,
			// HubEventType.REVOKE_MESSAGE,
		],
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
		// clog("subscribe/event", event);
		// const type = event.mergeMessageBody.message.data.type;
		// if (type !== 1) continue;
		const parsedTry = HubEventSchema.passthrough().safeParse(event);
		if (!parsedTry.success) clog("subscribe/parse", parsedTry.error);
		else eventHandler(parsedTry.data);
	}
	client.close();
});
