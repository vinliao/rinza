import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css";

// @ts-ignore
ReactDOM.createRoot(document.getElementById("app")).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
