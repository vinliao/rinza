import { getSSLHubRpcClient, HubEventType } from "@farcaster/hub-nodejs";
import { emitter } from "./singletons";
import {
	encodeBase64,
	HubEventMergeSchema,
	userDataTypeMap,
} from "@rinza/utils";
import { z } from "zod";
import { appendFile } from "fs";
import sqlite from "better-sqlite3";

const FARCASTER_EPOCH = 1609459200; // January 1, 2021 UTC

const hubRpcEndpoint = "20eef7.hubs.neynar.com:2283";
const client = getSSLHubRpcClient(hubRpcEndpoint);
const db = new sqlite("log.sqlite");
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    hubEventId INTEGER PRIMARY KEY,
    hash TEXT,
    fid INTEGER,
    type INTEGER,
    timestamp INTEGER,
    description TEXT,
    raw TEXT
  );
`);

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

const embedMentions = (c: any) => {
	const conds = [
		!c.mentions,
		!c.mentionsPositions,
		c.mentions.length === 0,
		c.mentionsPositions.length === 0,
	];
	if (conds.every(Boolean)) return c;

	let tmp = c.text;
	for (let i = c.mentionsPositions.length - 1; i >= 0; i--) {
		const position = c.mentionsPositions[i];
		const fid = c.mentions[i];
		tmp = `${tmp.slice(0, position)}fid:${fid}${tmp.slice(position)}`;
	}
	return tmp;
};

const makeDescription = (event: z.infer<typeof HubEventMergeSchema>) => {
	const fid = event.mergeMessageBody.message.data.fid;
	const hash = event.mergeMessageBody.message.hash.slice(2, 10);
	const type = event.mergeMessageBody.message.data.type;

	// TODO: how to bulk pull fid:username mapping?
	// TODO: fid:123 is placeholder for username and pfp
	// TODO: cast:f12bc is placeholder for pfp, username, and trunc'd text
	if (type === 1) {
		// @ts-ignore
		const cast = event.mergeMessageBody.message.data.castAddBody;
		const text = embedMentions(cast);
		return `fid:${fid} casted cast:${hash} ${text}`;
	} else if (type === 2) {
		// @ts-ignore
		const cast = event.mergeMessageBody.deletedMessages[0].data.castAddBody;
		const text = embedMentions(cast);
		return `fid:${fid} deleted cast:${hash} ${text}`;
	} else if (type === 3 || type === 4) {
		// @ts-ignore
		const reactionBody = event.mergeMessageBody.message.data.reactionBody;
		const reactionType = reactionBody.type === 1 ? "like" : "recast";
		const targetHash = reactionBody.targetCastId.hash.slice(2, 10);
		if (type === 3)
			return `fid:${fid} reaction:${reactionType} cast:${targetHash}`;
		return `fid:${fid} removed reaction:${reactionType} cast:${targetHash}`;
	} else if (type === 5 || type === 6) {
		// @ts-ignore
		const linkBody = event.mergeMessageBody.message.data.linkBody;
		const linkType = linkBody.type; // string, not enum
		const targetFid = linkBody.targetFid;
		if (type === 5) return `fid:${fid} link:${linkType} fid:${targetFid}`;
		return `fid:${fid} removed link:${linkType} fid:${targetFid}`;
	} else if (type === 7) {
		const verificationAddEthAddressBody =
			// @ts-ignore
			event.mergeMessageBody.message.data.verificationAddEthAddressBody;
		const address = verificationAddEthAddressBody.address.slice(2, 10);
		const blockHash = verificationAddEthAddressBody.blockHash.slice(2, 10);
		return `fid:${fid} verified addr:${address} on block:${blockHash}`;
	} else if (type === 8) {
		const verificationRemoveBody =
			// @ts-ignore
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
		const timestamp =
			Number(parsed.mergeMessageBody.message.data.timestamp) + FARCASTER_EPOCH;
		// flatten data for easier access, esp when stuffed to sqlite later on
		const payload = {
			hubEventId: parsed.id,
			hash: parsed.mergeMessageBody.message.hash,
			fid: parsed.mergeMessageBody.message.data.fid,
			type: parsed.mergeMessageBody.message.data.type,
			timestamp,
			description: makeDescription(parsed),
			raw: encodeBase64(parsed),
		};

		clog("subscribe/payload", payload);
		db.prepare(`
      INSERT INTO events (
        hubEventId,
        hash,
        fid,
        type,
        timestamp,
        description,
        raw
      ) VALUES (
        @hubEventId,
        @hash,
        @fid,
        @type,
        @timestamp,
        @description,
        @raw
      )
    `).run(payload);

		emitter.emit("merge-message", payload);
	}
	client.close();
});
