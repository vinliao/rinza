import express from "express";
import cors from "cors";
import { emitter, rollingLog } from "./shared";
import http from "http";
import { Server } from "socket.io";
import { NotifierEventSchema, NotifierEventType } from "@rinza/farcaster-hooks";

const app = express();
const port = Number(process.env.PORT) || 3000;
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

// TODO: should only be enabled in dev!
app.use(cors());

app.get("/", (req, res) => {
	res.send({ message: "Hello, world!" });
});

io.on("connection", (socket) => {
	const sendEventToClient = (data: NotifierEventType) => {
		socket.emit("event", JSON.stringify(data));
	};

	emitter.on("all-event", sendEventToClient);
	socket.on("disconnect", () => {
		emitter.off("all-event", sendEventToClient);
		console.log("Client disconnected");
	});
});

server.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});

// TODO: listen cast reply mention
