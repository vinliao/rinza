import { z } from "zod";
import utf8 from "utf8";
import base64 from "base-64";
import { Buffer } from "buffer";

export const clog = (where: string, data: unknown): void => {
	const stringify = (data: unknown): string => {
		if (data instanceof Map) return JSON.stringify(Array.from(data.entries()));
		if (typeof data === "object") return JSON.stringify(data);
		return String(data);
	};

	const timestamp = new Date().toISOString();
	const log = `${timestamp} - ${where} - ${stringify(data)}`;
	console.log(log);

	if (typeof process !== "undefined" && process.versions?.node) {
		const fs = require("fs");
		fs.appendFile("./app.log", `${log}`, (err) => {
			if (err) {
				console.error("Error writing to log file:", err);
			}
		});
	}
};

export const encodeBase64 = (obj: object) => {
	return base64.encode(utf8.encode(JSON.stringify(obj)));
};
export const parseBase64 = (raw: string) => {
	return JSON.parse(utf8.decode(base64.decode(raw)));
};

export const BufferSchema = z.instanceof(Buffer).transform((buffer) => {
	return `0x${buffer.toString("hex")}`;
});

export const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

const CastIdSchema = z.object({
	fid: z.number(),
	hash: BufferSchema,
});

const EmbedSchema = z.object({
	url: z.string(),
});

// TODO: figure out how to dedupe
// message type 1
export const CastAddMessageSchema = z.object({
	data: z.object({
		type: z.number(),
		fid: z.number(),
		timestamp: z.number(),
		network: z.number(),
		castAddBody: z.object({
			embedsDeprecated: z.array(z.string()),
			mentions: z.array(z.number()),
			parentCastId: CastIdSchema.optional(),
			parentUrl: z.string().optional(),
			text: z.string(),
			mentionsPositions: z.array(z.number()),
			embeds: z.array(EmbedSchema),
		}),
	}),
	hash: BufferSchema,
	hashScheme: z.number(),
	signature: BufferSchema,
	signatureScheme: z.number(),
	signer: BufferSchema,
});
export type CastAddMessageType = z.infer<typeof CastAddMessageSchema>;

// message type 2
const CastRemoveMessageSchema = z.object({
	data: z.object({
		type: z.number(),
		fid: z.number(),
		timestamp: z.number(),
		network: z.number(),
		castRemoveBody: z.object({
			targetHash: BufferSchema,
		}),
	}),
	hash: BufferSchema,
	hashScheme: z.number(),
	signature: BufferSchema,
	signatureScheme: z.number(),
	signer: BufferSchema,
});

// message type 3 and 4
const ReactionMessageSchema = z.object({
	data: z.object({
		type: z.number(),
		fid: z.number(),
		timestamp: z.number(),
		network: z.number(),
		reactionBody: z.object({
			type: z.number(),
			targetCastId: CastIdSchema,
			targetUrl: z.string().optional(),
		}),
	}),
	hash: BufferSchema,
	hashScheme: z.number(),
	signature: BufferSchema,
	signatureScheme: z.number(),
	signer: BufferSchema,
});

// message type 5 and 6
const LinkMessageSchema = z.object({
	data: z.object({
		type: z.number(),
		fid: z.number(),
		timestamp: z.number(),
		network: z.number(),
		linkBody: z.object({
			type: z.string(),
			targetFid: z.number(),
		}),
	}),
	hash: BufferSchema,
	hashScheme: z.number(),
	signature: BufferSchema,
	signatureScheme: z.number(),
	signer: BufferSchema,
});

// message type 7
const VerificationAddEthAddressSchema = z.object({
	data: z.object({
		type: z.number(),
		fid: z.number(),
		timestamp: z.number(),
		network: z.number(),
		verificationAddEthAddressBody: z.object({
			address: BufferSchema,
			ethSignature: BufferSchema,
			blockHash: BufferSchema,
		}),
	}),
	hash: BufferSchema,
	hashScheme: z.number(),
	signature: BufferSchema,
	signatureScheme: z.number(),
	signer: BufferSchema,
});

// message type 8
const VerificationRemoveSchema = z.object({
	data: z.object({
		type: z.number(),
		fid: z.number(),
		timestamp: z.number(),
		network: z.number(),
		verificationRemoveBody: z.object({
			address: BufferSchema,
		}),
	}),
	hash: BufferSchema,
	hashScheme: z.number(),
	signature: BufferSchema,
	signatureScheme: z.number(),
	signer: BufferSchema,
});

// message type 11
const UserDataAddSchema = z.object({
	data: z.object({
		type: z.number(),
		fid: z.number(),
		timestamp: z.number(),
		network: z.number(),
		userDataBody: z.object({
			type: z.number(),
			value: z.string(),
		}),
	}),
	hash: BufferSchema,
	hashScheme: z.number(),
	signature: BufferSchema,
	signatureScheme: z.number(),
	signer: BufferSchema,
});

const MessageSchema = z.union([
	CastAddMessageSchema,
	CastRemoveMessageSchema,
	ReactionMessageSchema,
	LinkMessageSchema,
	VerificationAddEthAddressSchema,
	VerificationRemoveSchema,
	UserDataAddSchema,
]);

export const HubEventMergeSchema = z.object({
	type: z.number(),
	id: z.number(),
	mergeMessageBody: z.object({
		message: MessageSchema,
		deletedMessages: z.array(MessageSchema),
	}),
});
export type HubEventMergeType = z.infer<typeof HubEventMergeSchema>;

// TODO: untested
export const HubEventPruneSchema = z.object({
	type: z.number(),
	id: z.number(),
	pruneMessageBody: z.object({
		message: MessageSchema,
	}),
});
export type HubEventPruneType = z.infer<typeof HubEventPruneSchema>;

// TODO: untested
const HubEventRevokeSchema = z.object({
	type: z.number(),
	id: z.number(),
	revokeMessageBody: z.object({
		message: MessageSchema,
	}),
});
export type HubEventRevokeType = z.infer<typeof HubEventRevokeSchema>;

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

// export const HubEventSchema = z.union([
// 	HubEventMergeSchema,
// 	HubEventPruneSchema,
// 	HubEventRevokeSchema,
// ]);

// key information should be flat, easier access, esp with sql
// export const NotifierEventSchema = z.object({
// 	hubEventId: z.number(),
// 	hash: z.string(),
// 	fid: z.number(),
// 	type: z.number(),
// 	timestamp: z.number(),
// 	description: z.string(),
// 	raw: HubEventMergeSchema,
// });
// export type NotifierEventType = z.infer<typeof NotifierEventSchema>;

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
	[0, "NONE"],
	[1, "CAST_ADD"],
	[2, "CAST_REMOVE"],
	[3, "REACTION_ADD"],
	[4, "REACTION_REMOVE"],
	[5, "LINK_ADD"],
	[6, "LINK_REMOVE"],
	[7, "VERIFICATION_ADD_ETH_ADDRESS"],
	[8, "VERIFICATION_REMOVE"],
	[9, "SIGNER_ADD"],
	[10, "SIGNER_REMOVE"],
	[11, "USER_DATA_ADD"],
	[12, "USERNAME_PROOF"],
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

// =====================================================================================
// extractor
// =====================================================================================

export const extractCast = (c: CastAddMessageType) => ({
	hash: c.hash,
	parentHash: c.data.castAddBody.parentCastId?.hash,
	parentFid: c.data.castAddBody.parentCastId?.fid,
	fid: c.data.fid,
	timestamp: c.data.timestamp,
	text: c.data.castAddBody.text,
	mentions: c.data.castAddBody.mentions,
	mentionsPositions: c.data.castAddBody.mentionsPositions,
	embeds: c.data.castAddBody.embeds,
	parentUrl: c.data.castAddBody.parentUrl,
});
export type InternalCastType = ReturnType<typeof extractCast>;
