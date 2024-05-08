'use strict';

// This file handles all the connections.
// Each web socket connection is added to a queue and any incoming data is sent to the serial port and any outgoing serial data is sent to all the web socket connections.

import { WebSocketServer } from 'ws';

import {Serial} from './serial.js';

// Get a list of ports on the system
const p = new Serial({});

p.on('data', (data) => {
    // send the data to all the connections
    console.info('Sending data to all connections:', data);
    sendAll(JSON.stringify({channel: "data", bytes: data}));
});
p.on('close', () => {
    console.log('Port closed');
    p.close();
    setTimeout(connectToSerialPort, 1)
});
p.on('error', (message) => {
    console.error(`Port reported an error: ${message}. \n Closing and trying to re-open the port.`);
    p.close();
    setTimeout(connectToSerialPort, 1)
});

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//  web socket list
const connections = [];

// Serial Port List
export let ports = []

// Create a WebSocket server
const wss = new WebSocketServer({ noServer: true })

async function sendAll(data){
    connections.forEach(ws => {
        ws.send(data);
    });
}

export function setup(server){
    server.on('upgrade', (req, socket, head) => {
        if (req.url !== '/serial-monitor') { return }
        wss.handleUpgrade(req, socket, head, (ws) => {
            connections.push(ws);
            wss.emit('connection', ws, req)
        })
    })
    
    // Event listener for new connections
    wss.on('connection', (ws) => {
        console.info('Client connected');
        // send over the list of ports
        ws.send(JSON.stringify({channel: "ports", ports}));
    
        // Event listener for incoming messages
        ws.on('message', (message) => {
            console.log('Received message:', message);
        });
        
        // Event listener for connection close
        ws.on('close', () => {
            console.info('Client disconnected');
            // delete this from the connctions list
            const index = connections.indexOf(ws);
            if (index > -1) {
                connections.splice(index, 1);
            }
        });
    });

    wss.on('error', (error) => {
        console.error('Error:', error);
    });

    // run this in the "background"
    setTimeout(connectToSerialPort, 1)
    return wss;
}    

async function connectToSerialPort(){
    function sendAll(data){
        connections.forEach(ws => {
            ws.send(data);
        });
    }

    ports.length = 0;
    try {
        console.info(`Connecting to serial port...`);
        while (ports.length == 0){
            ports = await p.list();
            if (ports.length == 0) {
                console.info('No ports found, waiting 5 seconds before retrying...');
                await sleep(5000);
            }
        }
        sendAll(JSON.stringify({channel: "ports", ports}));
        await p.modifyConfig({path: ports[0].path})
        await p.open();
    } catch (error) {
        console.error(error);
    }
}
