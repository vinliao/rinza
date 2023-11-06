import { z } from "zod";
import { makeBot } from "@rinza/farcaster-bot";

const pictureEcho = async (
	apiKey: string,
	signer: string,
	parentHash?: string,
) => {
	const url = "https://api.neynar.com/v2/farcaster/cast";
	const headers = {
		"Content-Type": "application/json",
		api_key: apiKey,
	};

	const res = await fetch(url, {
		method: "POST",
		headers,
		body: JSON.stringify({
			text: "echo!",
			signer_uuid: signer,
			parent: parentHash,
		}),
	});
	const json = await res.json();
	return json;
};

const apiKey = z.string().parse(process.env.NEYNAR_API_KEY);
const pictureSigner = z.string().parse(process.env.PICTURE_NEYNAR_SIGNER_UUID);
pictureEcho(apiKey, pictureSigner);

const bot = makeBot({ fid: 4640, notifierURL: "http://localhost:3000" });
bot.onmessage((ctx) => {
	pictureEcho(apiKey, pictureSigner, ctx.parentHash);
});
