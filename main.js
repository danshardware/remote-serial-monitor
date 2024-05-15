import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

export const term = new Terminal({
    cursorBlink: true,
    outerHeight: "100",
    fontFamily: '"Source Code Pro", "Courier New"'
});
const fit = new FitAddon();
term.loadAddon(fit);
term.open(document.getElementById('terminal'));
fit.fit();

let config = {
    unixLf: true,
}

window.addEventListener('resize', () => {
    fit.fit();
});

term.write(`Connecting to \x1B[1;3;31mws://${location.host}/serial-monitor\x1B[0m ... `)

// Start a websocket connection
const ws = new WebSocket(`ws://${location.host}/serial-monitor`);

ws.onopen = () => {
    term.writeln("Connected!");
}
ws.onmessage = (event) => {
    // validate the incoming data is valid JSON
    try {
        const data = JSON.parse(event.data);

        // make sure it has a channel attribute
        if (!data.channel) return;

        // handle the incoming data based on what channel is sent
        switch (data.channel) {
            case "ports":
                console.log(data);
                break;
            case "data":
                if (!data.bytes) return;
                console.debug(data.bytes.data);
                // some repalce logic
                for (const x of data.bytes.data){
                    // replace newlinew with \r\n is config.unixLf is true
                    if (config.unixLf && x == 10) {
                        term.write("\r\n");
                    } else {
                        const buffer = new Uint8Array([x]);
                        term.write(buffer);
                    }
                }
                break;
            default:
                console.error("Unknown channel:", data.channel);
                console.debug(data);
        }
    } catch (error) {
        console.error(error);
    }
}

// Handle keyboard input
term.onKey((e/*: { key: string, domEvent: KeyboardEvent }*/) => {
    const ev = e.domEvent;
    const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

    ws.send(JSON.stringify({channel: "data", data: e.key}))
});