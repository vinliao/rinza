import { getSSLHubRpcClient, HubEventType } from "@farcaster/hub-nodejs";
import { emitter, rollingLog } from "./shared";
import { HubEventMergeSchema, userDataTypeMap } from "@rinza/utils";
import base64 from "base-64";
import utf8 from "utf8";
import { z } from "zod";
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

const makeDescription = (event: z.infer<typeof HubEventMergeSchema>) => {
	const fid = event.mergeMessageBody.message.data.fid;
	const hash = event.mergeMessageBody.message.hash.slice(2, 10);
	const type = event.mergeMessageBody.message.data.type;

	// TODO: how to bulk pull fid:username mapping?
	// TODO: fid:123 is placeholder for username and pfp
	// TODO: cast:f12bc is placeholder for pfp, username, and trunc'd text
	if (type === 1) {
		return `fid:${fid} cast:${hash}`;
	} else if (type === 2) {
		return `fid:${fid} removed cast:${hash}`;
	} else if (type === 3) {
		// @ts-ignore
		const reactionBody = event.mergeMessageBody.message.data.reactionBody;
		const reactionType = reactionBody.type === 1 ? "liked" : "recasted";
		const targetHash = reactionBody.targetCastId.hash.slice(2, 10);
		return `fid:${fid} ${reactionType} cast:${targetHash}`;
	} else if (type === 4) {
		// @ts-ignore
		const reactionBody = event.mergeMessageBody.message.data.reactionBody;
		const reactionType = reactionBody.type === 1 ? "unliked" : "unrecasted";
		const targetHash = reactionBody.targetCastId.hash.slice(2, 10);
		return `fid:${fid} ${reactionType} cast:${targetHash}`;
	} else if (type === 5) {
		// @ts-ignore
		const linkBody = event.mergeMessageBody.message.data.linkBody;
		const linkType = linkBody.type; // string, not enum
		const targetFid = linkBody.targetFid;
		return `fid:${fid} link:${linkType} fid:${targetFid}`;
	} else if (type === 6) {
		// @ts-ignore
		const linkBody = event.mergeMessageBody.message.data.linkBody;
		const linkType = linkBody.type; // string, not enum
		const targetFid = linkBody.targetFid;
		return `fid:${fid} removed link:${linkType} fid:${targetFid}`;
	} else if (type === 7) {
		// @ts-ignore
		const verificationAddEthAddressBody =
			event.mergeMessageBody.message.data.verificationAddEthAddressBody;
		const address = verificationAddEthAddressBody.address.slice(2, 10);
		const blockHash = verificationAddEthAddressBody.blockHash.slice(2, 10);
		return `fid:${fid} verified addr:${address} on block:${blockHash}`;
	} else if (type === 8) {
		// @ts-ignore
		const verificationRemoveBody =
			event.mergeMessageBody.message.data.verificationRemoveBody;
		const address = verificationRemoveBody.address.slice(2, 10);
		return `fid:${fid} removed addr:${address} verification`;
	} else if (type === 11) {
		// @ts-ignore
		const userDataBody = event.mergeMessageBody.message.data.userDataBody;
		const type = userDataBody.type;
		const value = userDataBody.value;
		return `fid:${fid} updated ${userDataTypeMap.get(type)} to ${value}`;
	} else {
		return `unknown event type: ${type}, fid:${fid} hash:${hash}`;
	}
};

const hubRpcEndpoint = "20eef7.hubs.neynar.com:2283";
const client = getSSLHubRpcClient(hubRpcEndpoint);

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
		const parsedTry = HubEventMergeSchema.safeParse(event);
		if (!parsedTry.success) {
			clog("subscribe/event", event);
			clog("subscribe/parsedTry.error", parsedTry.error);
			return;
		}

		const parsed = parsedTry.data;
		// flatten data for easier access, esp when stuffed to sqlite later on
		const payload = {
			hubEventId: parsed.id,
			hash: parsed.mergeMessageBody.message.hash,
			fid: parsed.mergeMessageBody.message.data.fid,
			type: parsed.mergeMessageBody.message.data.type,
			timestamp: parsed.mergeMessageBody.message.data.timestamp,
			description: makeDescription(parsed),
			raw: base64.encode(utf8.encode(JSON.stringify(parsed))),
		};

		clog("subscribe/payload", payload);
		rollingLog.appendLine(payload);
		emitter.emit("all-event", payload);
	}
	client.close();
});
