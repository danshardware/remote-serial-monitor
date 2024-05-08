import express from 'express';
import ViteExpress from "vite-express";
import {setup, ports} from './connectionHandler.js';
import fs from 'fs';

// check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction){
    // check if the dist folder exists and link it to the vite build
    try {
        if (fs.existsSync('dist')) {
            console.log("Found dist folder in ./dist");
            ViteExpress.config({ 
                inlineViteConfig: { 
                //    build: { outDir: "out" }
                } 
            } )
            
        } else if (fs.existsSync('../dist')) {
            console.log("Found dist folder in ../dist");
            ViteExpress.config({ 
                inlineViteConfig: { 
                    build: { outDir: "../dist" }
                } 
            } );
            
        } else {
            console.error("Dist folder not found, please run `npm run build` first");
            process.exit(1);
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
    console.log("Running in production mode");
}

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

