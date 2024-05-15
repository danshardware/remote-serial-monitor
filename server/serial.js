"use strict";

import { SerialPort } from 'serialport'

export class SerialConfig{
    path = '';
    baudRate = 115200;
    port = '';
    stopBits = 1;
    dataBits = 8;
    parity = 'N';
}

export class PortDescription {
    path = '';
    manufacturer = '';
    serialNumber = '';
    pnpId = '';
    locationId = '';
    vendorId = '';
    productId = '';

    constructor(port){
        if (!port) return;
        
        this.path = port.path;
        this.manufacturer = port.manufacturer;
        this.serialNumber = port.serialNumber;
        this.pnpId = port.pnpId;
        this.locationId = port.locationId;
        this.vendorId = port.vendorId;
        this.productId = port.productId;
    }
}

export class Serial {
    error = undefined;
    port = undefined;
    config = undefined;
    callbacks = {};

    constructor(config){
        const defaults = new SerialConfig();
        this.config = {...defaults, ...config};
        this.bindings = SerialPort.binding;
    }

    async modifyConfig(config){
        if (typeof config !== 'object') throw new Error('Invalid port description');
        if (this.config.path === '' && (!config.path || config.path === '')) throw new Error('Invalid port path');
        this.config = {...this.config, ...config};
        if (this._port){
            if (this._port.isOpen)this._port.close();
            await this.open();
        }
        return this;
    }

    // port(){
    //     return this._port;
    // }

    on(event, callback){
        this.callbacks[event] = callback;
        if (!this._port) return;
        console.log(`Applying callback for event: ${event}`)
        this._port.on(event, callback);
        return this;
    }

    async open(){
        try {
            if (this._port && this._port.isOpen) this.close();
            const options = {
                path: this.config.path,
                baudRate: this.config.baudRate,
                dataBits: this.config.dataBits,
                stopBits: this.config.stopBits,
                parity: this.config.parity
            }
            console.debug('Opening port with options:')
            console.debug(options)
            this._port = new SerialPort(options);
            // re-apply callbacks
            for (const event in this.callbacks){
                console.info(`Re-applying callback for event: ${event}`)
                this._port.on(event, this.callbacks[event])
            }
        } catch (error) {
            this._port = undefined;
            console.error(error);
        }
        return this;
    }

    write(data){
        this._port.write(Uint8Array.from(data));
        return this;
    }

    close(){
        if (this._port && this._port.isOpen) this._port.close();
        this._port = undefined;
    }

    async list(){
        try {
            const ports  = (await this.bindings.list()).map(port => new PortDescription(port));
            return ports;
        } catch (error) {
            console.error(error);
            return [];
        }
    }
}

export default {Serial, SerialConfig};