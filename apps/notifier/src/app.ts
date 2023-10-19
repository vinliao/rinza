import express from "express";
import emitter from "./emitter";

const app = express();

// enable cors
// TODO: figure out local-only cors
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	next();
});

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
	res.send({ message: "Hello, world!" });
});

app.get("/listen", async (req, res) => {
	const fid = req.query.fid;
	const eventKey = fid ? `reply-mention-${fid}` : "all-cast";
	const timeout = Math.min(Number(req.query.timeout) || 60, 60) * 1000;

	const data = await Promise.race([
		new Promise((resolve) => {
			emitter.on(eventKey, (data) => {
				resolve(data);
				emitter.removeAllListeners(eventKey);
			});
		}),
		new Promise((resolve) => {
			setTimeout(() => {
				resolve({ message: "timeout" });
			}, timeout);
		}),
	]);

	res.send(data);
});

app.get("/listen-test", function poll(req, res) {
	setTimeout(() => {
		const hubEventId = Math.random().toString(36).substring(2, 42);
		const fid = Math.floor(Math.random() * 20000) + 1;
		const hash = Math.random().toString(36).substring(2, 42);
		res.send({ fid, hash, hubEventId });
	}, 2000);
});

app.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`);
});
