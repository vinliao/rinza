import { io } from "socket.io-client";

const makeBot = ({
	fid,
	returnsThread,
	notifierURL = "https://rinza-notifier.up.railway.app",
}: { fid: number; returnsThread: boolean; notifierURL?: string }) => {
	const socket = io("http://localhost:3000");

	return {
		onmessage: (cb: (ctx: any) => void) => {
			socket.on("reply-mention-3", (message) => {
				cb({ fid, returnsThread, message });
			});
		},
	};
};

// ctx.casts
// ctx.parentC
const bot = makeBot({ fid: 1, returnsThread: true });
bot.onmessage((ctx) => {
	console.log(ctx);
});
