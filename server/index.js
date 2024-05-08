import express from 'express';
import ViteExpress from "vite-express";
import {setup, ports} from './connectionHandler.js';

// Create the server
const HTTP_PORT = process.env.HTTP_PORT || 8080;
const app = express()
const server = ViteExpress.listen(app, HTTP_PORT, () => console.log("Server is listening..."))

setup(server);

// Some APIs
app.get("/api/info", (_req, res) => {
    res.json({ 
        name: "serial-monitor",
        time: new Date().toISOString(),
     });
});

app.get("/api/ports", async (_req, res) => {
    res.json(ports);
});

