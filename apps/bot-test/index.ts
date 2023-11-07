import { z } from "zod";
import { makeBot } from "@rinza/farcaster-bot";

const neynarPoster =
	(apiKey: string, signer: string) =>
	async (text: string, parentHash?: string) => {
		const url = "https://api.neynar.com/v2/farcaster/cast";
		const headers = {
			"Content-Type": "application/json",
			api_key: apiKey,
		};

		const res = await fetch(url, {
			method: "POST",
			headers,
			body: JSON.stringify({
				text,
				signer_uuid: signer,
				parent: parentHash,
			}),
		});
		const json = await res.json();
		return json;
	};

const apiKey = z.string().parse(process.env.NEYNAR_API_KEY);
const pictureSigner = z.string().parse(process.env.PICTURE_NEYNAR_SIGNER_UUID);
const poster = neynarPoster(apiKey, pictureSigner);

const notifierURL = process.env.IS_DEV
	? "http://localhost:3000"
	: "https://rinza-notifier.up.railway.app";
console.log("notifierURL", notifierURL);

const bot = makeBot({
	fid: 4640,
	notifierURL,
});
bot.onmessage((ctx) => {
	poster("echo!", ctx.parentHash);
});