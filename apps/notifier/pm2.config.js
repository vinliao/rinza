module.exports = {
	apps: [
		{
			name: "notifier",
			script: "node ./dist/index.js",
			instances: 1,
			max_memory_restart: "300M",
			autorestart: true,
			watch: ["./dist"],
			ignore_watch: ["node_modules", "logs"],
			cron_restart: "0 */3 * * *",
		},
	],
};
