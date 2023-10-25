import { z } from "zod";

export const BufferSchema = z.instanceof(Buffer).transform((buffer) => {
	return `0x${buffer.toString("hex")}`;
});

export const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const NotifierEventSchema = z.object({
	hubEventId: z.number(),
	hash: z.string(),
	fid: z.number(),
	type: z.number(),
	timestamp: z.number(),
});
export type NotifierEventType = z.infer<typeof NotifierEventSchema>;

const LinkBodySchema = z.object({ type: z.string(), targetFid: z.number() });
const MessageSchema = z.object({
	data: z.object({
		type: z.number(),
		fid: z.number(),
		timestamp: z.number(),
		network: z.number(),
		linkBody: LinkBodySchema,
	}),
	hash: BufferSchema,
	hashScheme: z.number(),
	signature: BufferSchema,
	signatureScheme: z.number(),
	signer: BufferSchema,
});

export const HubEventSchema = z.object({
	type: z.number(),
	id: z.number(),
	mergeMessageBody: z.object({
		message: MessageSchema,
		deletedMessages: z.array(MessageSchema),
	}),
});
export type HubEventType = z.infer<typeof HubEventSchema>;

// // =====================================================================================
// // clients
// // =====================================================================================

// export const warpcast = (apiKey: string) => {
// 	const cast = async (text: string, parent?: unknown) => {
// 		const url = "https://api.warpcast.com/v2/casts";
// 		const headers = {
// 			accept: "application/json",
// 			authorization: `Bearer ${apiKey}`,
// 			"Content-Type": "application/json",
// 		};

// 		const body = JSON.stringify({ text, parent: { hash: parent?.hash } });
// 		const response = await fetch(url, { method: "POST", headers, body });
// 		const data = await response.json();
// 		clog("warpcast/cast", data);
// 		return data;
// 	};

// 	const remove = async (hash: string) => {
// 		const url = "https://api.warpcast.com/v2/casts";
// 		const headers = {
// 			accept: "application/json",
// 			authorization: `Bearer ${apiKey}`,
// 			"Content-Type": "application/json",
// 		};

// 		const body = JSON.stringify({ castHash: hash });
// 		const response = await fetch(url, { method: "DELETE", headers, body });
// 		const data = await response.json();
// 		clog("warpcast/remove", data);
// 		return data;
// 	};

// 	return { cast, remove };
// };

// export const neynar = (signerUUID: string, apiKey: string) => {
// 	const cast = async (text: string, parent?: unknown) => {
// 		const url = "https://api.neynar.com/v2/farcaster/cast";
// 		const headers = { api_key: apiKey, "Content-Type": "application/json" };
// 		const body = JSON.stringify({
// 			signer_uuid: signerUUID,
// 			text: text,
// 			parent: parent?.hash,
// 		});

// 		const response = await fetch(url, { method: "POST", headers, body });
// 		const data = await response.json();
// 		clog("neynar/cast", data);
// 		return data;
// 	};

// 	const remove = async (hash: string) => {
// 		const url = "https://api.neynar.com/v2/farcaster/cast";
// 		const headers = { api_key: apiKey, "Content-Type": "application/json" };
// 		const body = JSON.stringify({
// 			signer_uuid: signerUUID,
// 			target_hash: hash,
// 		});

// 		const response = await fetch(url, { method: "DELETE", headers, body });
// 		const data = await response.json();
// 		clog("neynar/remove", data);
// 		return data;
// 	};

// 	return { cast, remove };
// };

// // TODO: where's parent_url
// export const extractCastById = (c: z.infer<typeof CastByIdSchema>) => ({
// 	hash: c.hash,
// 	parentHash: c.data.castAddBody.parentCastId?.hash,
// 	parentFid: c.data.castAddBody.parentCastId?.fid,
// 	fid: c.data.fid,
// 	timestamp: c.data.timestamp,
// 	text: c.data.castAddBody.text,
// 	mentions: c.data.castAddBody.mentions,
// 	mentionsPositions: c.data.castAddBody.mentionsPositions,
// 	embeds: c.data.castAddBody.embeds,
// });

// const sortByTimestamp = (cs: any[]) => {
// 	cs.sort((a, b) => a.timestamp - b.timestamp);
// 	return cs.reverse();
// };

// const transformTimestmap = (c: any) => {
// 	const FARCASTER_EPOCH = 1609459200; // January 1, 2021 UTC
// 	return {
// 		...c,
// 		timestamp: c.timestamp + FARCASTER_EPOCH,
// 	};
// };

// const deleteMentions = (c: any) => {
// 	const { mentions, mentionsPositions, ...rest } = c;
// 	return rest;
// };

// const addUsername = (c: any, fidUsernameMap: Map<number, string>) => {
// 	const username = fidUsernameMap.get(c.fid) || "unknown";
// 	return {
// 		...c,
// 		username,
// 	};
// };

// const embedMentions = (c: any, fidUsernameMap: Map<number, string>) => {
// 	const conds = [
// 		!c.mentions,
// 		!c.mentionsPositions,
// 		c.mentions.length === 0,
// 		c.mentionsPositions.length === 0,
// 	];

// 	if (conds.every(Boolean)) return c;

// 	let tmp = c.text;
// 	for (let i = c.mentionsPositions.length - 1; i >= 0; i--) {
// 		const position = c.mentionsPositions[i];
// 		const username = fidUsernameMap.get(c.mentions[i]) || "unknown";
// 		tmp = `${tmp.slice(0, position)}@${username}${tmp.slice(position)}`;
// 	}
// 	return { ...c, text: tmp };
// };

// =====================================================================================
// const maps
// =====================================================================================

export const hashSchemeMap = new Map([
	[0, "HASH_SCHEME_NONE"],
	[1, "HASH_SCHEME_BLAKE3"],
]);

export const signatureSchemeMap = new Map([
	[0, "SIGNATURE_SCHEME_NONE"],
	[1, "SIGNATURE_SCHEME_ED25519"],
	[2, "SIGNATURE_SCHEME_EIP712"],
]);

export const messageTypeMap = new Map([
	[0, "MESSAGE_TYPE_NONE"],
	[1, "MESSAGE_TYPE_CAST_ADD"],
	[2, "MESSAGE_TYPE_CAST_REMOVE"],
	[3, "MESSAGE_TYPE_REACTION_ADD"],
	[4, "MESSAGE_TYPE_REACTION_REMOVE"],
	[5, "MESSAGE_TYPE_LINK_ADD"],
	[6, "MESSAGE_TYPE_LINK_REMOVE"],
	[7, "MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS"],
	[8, "MESSAGE_TYPE_VERIFICATION_REMOVE"],
	[9, "MESSAGE_TYPE_SIGNER_ADD"],
	[10, "MESSAGE_TYPE_SIGNER_REMOVE"],
	[11, "MESSAGE_TYPE_USER_DATA_ADD"],
	[12, "MESSAGE_TYPE_USERNAME_PROOF"],
]);

export const userDataTypeMap = new Map([
	[0, "USER_DATA_TYPE_NONE"],
	[1, "USER_DATA_TYPE_PFP"],
	[2, "USER_DATA_TYPE_DISPLAY"],
	[3, "USER_DATA_TYPE_BIO"],
	[5, "USER_DATA_TYPE_URL"],
	[6, "USER_DATA_TYPE_USERNAME"],
]);

export const reactionTypeMap = new Map([
	[0, "REACTION_TYPE_NONE"],
	[1, "REACTION_TYPE_LIKE"],
	[2, "REACTION_TYPE_RECAST"],
]);
