import { z } from "zod";

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
const CastAddMessageSchema = z.object({
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
