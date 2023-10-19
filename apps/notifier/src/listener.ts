import { z } from "zod";
import { getSSLHubRpcClient, HubEventType } from "@farcaster/hub-nodejs";
import emitter from "./emitter";
import { clog } from "@rinza/utils";

const BufferSchema = z.instanceof(Buffer).transform((buffer) => {
	return `0x${buffer.toString("hex")}`;
});

const CastAddBodySchema = z.object({
	embedsDeprecated: z.array(z.unknown()),
	mentions: z.array(z.number()),
	parentCastId: z
		.object({
			fid: z.number(),
			hash: BufferSchema,
		})
		.nullish(),
	text: z.string(),
	mentionsPositions: z.array(z.number()),
	embeds: z.array(z.object({ url: z.string() })),
});

const MergeMessageBodySchema = z.object({
	message: z.object({
		data: z.object({
			type: z.number(),
			fid: z.number(),
			timestamp: z.number(),
			network: z.number(),
			castAddBody: CastAddBodySchema,
		}),
		hash: BufferSchema,
		hashScheme: z.number(),
		signature: BufferSchema,
		signatureScheme: z.number(),
		signer: BufferSchema,
	}),
	// deletedMessages: z.array(z.unknown()), // deal with this later
});

const EventSchema = z.object({
	type: z.number(),
	id: z.number(),
	mergeMessageBody: MergeMessageBodySchema,
});

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
