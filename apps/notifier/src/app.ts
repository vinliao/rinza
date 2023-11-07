import express from "express";
import cors from "cors";
import { emitter } from "./singletons";
import http from "http";
import { Server } from "socket.io";
import {
	InternalCastType,
	NotifierEventType,
	extractCast,
	parseBase64,
} from "@rinza/utils";
import sqlite from "better-sqlite3";

const db = new sqlite("log.sqlite");
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
	const onMergeMessage = (data: NotifierEventType) => {
		socket.emit("merge-message", data);
	};

	const onCastAdd = (cast: InternalCastType) => {
		socket.emit("cast-add", cast);
		socket.emit(`reply-mention-${cast.fid}`, cast);
		socket.emit(`reply-mention-${cast.parentFid}`, cast);
	};

	// Attach listeners
	emitter.on("merge-message", onMergeMessage);
	emitter.on("cast-add", onCastAdd);

	socket.on("disconnect", () => {
		// Remove listeners using the named function references
		emitter.off("merge-message", onMergeMessage);
		emitter.off("cast-add", onCastAdd);
		console.log("Client disconnected");
	});
});

app.get("/logs", (req, res) => {
	let limit = 25;
	if (typeof req.query.limit === "string") {
		limit = Math.min(parseInt(req.query.limit) || 25, 100);
	}
	const stmt = db.prepare(
		"SELECT * FROM events ORDER BY timestamp DESC LIMIT ?",
	);
	const lastLogs = stmt.all(limit);
	res.send(lastLogs);
});

server.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});

// app.get("/thread/:hash", (req, res) => {
// 	const hash = req.params.hash;
// 	// const stmt = db.prepare(
// 	//   "SELECT * FROM events WHERE hash = ? ORDER BY timestamp DESC",
// 	// );
// 	const thread = stmt.all(hash);
// 	res.send(thread);
// });

// TODO: listen cast reply mention
