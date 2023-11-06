import { io } from "socket.io-client";
import { InternalCastType } from "@rinza/utils";

type ContextType = {
	casts: InternalCastType[];
	parentFid?: number;
	parentHash?: string;
};

export const makeBot = ({
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
					parentFid: cast.fid,
					parentHash: cast.hash,
				});
			});
		},
	};
};
