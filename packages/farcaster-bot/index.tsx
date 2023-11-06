import { io } from "socket.io-client";
import { InternalCastType } from "@rinza/utils";

type ContextType = {
	casts: InternalCastType[];
	parentFid?: number;
	parentHash?: string;
};

const makeBot = ({
	fid,
	notifierURL = "https://rinza-notifier.up.railway.app",
}: { fid: number; notifierURL?: string }) => {
	const socket = io(notifierURL);
	const eventName = `reply-mention-${fid}`;

	return {
		onmessage: (cb: (ctx: ContextType) => void) => {
			socket.on(eventName, (cast: InternalCastType) => {
				cb({
					casts: [cast],
					parentFid: cast.parentFid,
					parentHash: cast.parentHash,
				});
			});
		},
	};
};

const bot = makeBot({ fid: 4640 });
bot.onmessage((ctx) => {
	console.log(ctx);
});
