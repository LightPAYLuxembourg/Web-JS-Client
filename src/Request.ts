import * as client from "./Client.common";
import * as  base64 from "base-64";
import * as utf8 from "utf8";
import {Headers, HeadersInterface} from "./Headers";
import {rejects} from "assert";
import { PaymentDetailsInterface } from "./Client.common";

const https = require('https');
const http = require('http');
const CryptoJS = require("crypto-js");
const buildUrl = require("build-url");
const axios = require('axios').default;
const qs = require('querystring')

export default class Request {

    public api_version: string = "v1";
    /**
     * @param string test|prod
     */
    public mode: 'test' | 'prod' = "test";
    //public end_point = "http://localhost:9002";//https://demo.lunch-digi-pay.lu";
    public end_point = "https://webdemo.lunch-digi-pay.lu";
    public client: client.ClientsInterface;
    public port: number;

    constructor(client: client.ClientsInterface, mode: 'test' | 'prod', port: number = 9010) {
        this.client = client;
        this.mode = mode;
        this.port = port;
    }

    public getToken(data: client.DataInitInterface): Promise<any> {
        return new Promise((resolve, reject) => {
            this.post("/web/api/payments/init", data).then(data => {
                //console.log(res);
                resolve((<any>data).token);
            }).catch(err => {
                console.log(err);
                reject(err);
            })
        });
    }

    /**
     * This method is availabe for test mode only
     * @param token
     */
    public simulatePayment(token: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.post("/requests/pay/simulate", {
                payment_token: token
            }).then(res => {
                //console.log(res);
                resolve(res);
            }).catch(err => {
                console.log(err);
                reject(err);
            })
        });
    }

    public refundPayment(amount: number, trxid: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.post("/web/api/payments/refunds", {
                amount: amount,
                trx_id: trxid
            }).then(res => {
                //console.log(res);
                resolve(res);
            }).catch(err => {
                console.log(err);
                reject(err);
            });
        });
    }

    public cancelPayment(trxid: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.post("/web/api/payments/cancels", {
                trx_id: trxid
            }).then(res => {
                //console.log(res);
                resolve(res);
            }).catch(err => {
                console.log(err);
                reject(err);
            });
        });
    }

    public getPaymentStatus(trxid: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.get("/web/api/payments/status", {
                trx_id: trxid
            }).then(res => {
                //console.log(res);
                resolve((<any>res).payment_status);
            }).catch(err => {
                console.log(err);
                reject(err);
            });
        });
    }

    public getPaymentDetails(trxid: string): Promise<PaymentDetailsInterface> {
        return new Promise((resolve, reject) => {
            this.get<PaymentDetailsInterface>("/web/api/payments/details", {
                trx_id: trxid
            }).then(res => {
                //console.log(res);
                resolve(res);
            }).catch(err => {
                console.log(err);
                reject(err);
            });
        });
    }

    /**
     * Send à request to LightPAY Web API
     * @param method
     * @param path
     * @param content
     * @param is_authenticated
     * @param headers
     */

    public request<T>(method: string, path: string, content: {}, is_authenticated: boolean = true, headers: HeadersInterface[] = []): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            try {
                if (this.mode === "prod") {
                    this.end_point = "https://webdemo.lunch-digi-pay.lu";
                }

                let url;
                let body = "";
                const orderedBody = {};
                content = {...content, port: this.port}
                if (content && method == 'GET') {
                    url = buildUrl(this.end_point, {
                        hash: '',
                        path: "/" + this.api_version + path,
                        queryParams: content
                    });
                    body = qs.stringify({});
                } else if (content) {
                    content = {...content, port: this.port}
                    url = buildUrl(this.end_point, {
                        path: "/" + this.api_version + path,
                    });
                    Object.keys(content).sort().forEach(function (key) {
                        orderedBody[key] = content[key];
                    });

                    body = qs.stringify(orderedBody);
                } else {
                    body = "";
                }

                let hdr = new Headers();

                headers.forEach(element => {
                    console.log(element);
                    hdr.set(element.key, element.value);
                });

                if (is_authenticated) {
                    let now = new Date().getTime();

                    hdr.set('Content-Type', 'application/x-www-form-urlencoded');
                    hdr.set('X-LightPAY-Timestamp', now.toString());

                    if (this.client.consumer_key) {
                        let $toSign = [this.client.api_key , this.client.secret_key, this.client.consumer_key, method, url, body, now];
                        let $signature = this.sign($toSign);
                        const auth = this.client.consumer_key + ":" + this.client.api_key;
                        hdr.set('Authorization', "Basic " + base64.encode(utf8.encode(auth)));
                        hdr.set('X-LightPAY-Credentials', this.sign([this.client.api_key, this.client.secret_key]));
                        hdr.set('X-LightPAY-Signature', $signature);
                    }
                }

                console.log(body);
                console.log("url = " + url);

                const options = {
                    baseURL: url,
                    method: method,
                    data: body ? body : {},
                    responseType: 'json',
                    headers: {
                        "Content-Type": hdr.get("Content-Type"),
                        "Content-Length": Buffer.byteLength(JSON.stringify(body)),
                        "X-LightPAY-Timestamp": hdr.get("X-LightPAY-Timestamp"),
                        "Authorization": hdr.get("Authorization"),
                        "X-LightPAY-Credentials": hdr.get("X-LightPAY-Credentials"),
                        "X-LightPAY-Signature": hdr.get("X-LightPAY-Signature")
                    }
                };

                axios.request(options).then(res => {
                    resolve(res.data);
                }).catch(error => {
                    reject(error);
                });
            } catch (e) {
                console.log("ERROR >>s", e);
                return new Promise<T>((resolve, reject) => {
                    reject(e)
                });
            }

        });

    }

    /**
     * Send a POST request
     * @param path
     * @param content
     * @param headers
     */
    public post<T>(path: string, content, headers: HeadersInterface[] = []): Promise<T> {
        return this.request<T>('POST', path, content, true, headers);
    }


    /**
     * GET request
     * @param path
     * @param content
     * @param headers
     */
    public get<T>(path: string, content, headers: HeadersInterface[] = []): Promise<T> {
        return this.request<T>('GET', path, content, true, headers);
    }

    /**
     * Send a PUT request
     * @param path
     * @param content
     * @param headers
     */
    public put<T>(path: string, content: {}, headers: HeadersInterface[] = []): Promise<T> {
        content['_method'] = "PUT";
        return this.request<T>('POST', path, content, true, headers)
    }

    /**
     * Send a DELETE request
     * @param path
     * @param content
     * @param headers
     */
    public delete<T>(path: string, content: {}, headers: HeadersInterface[] = []): Promise<T> {
        content['_method'] = "DELETE";
        return this.request<T>('POST', path, content, true, headers)
    }

    private sign(data): string {
        if (!data)
            return "";

        try {
            let toSign;

            if (typeof data === "object")
                toSign = '$1$' + data.join("+");
            else
                toSign = '$1$' + data;

            const key = CryptoJS.enc.Hex.parse(this.client.secret_key.substr(0, 32));
            const iv = CryptoJS.enc.Hex.parse(this.client.consumer_key.substr(0, 32));
            const encrypted = CryptoJS.AES.encrypt(toSign, key, {
                iv
                //padding: CryptoJS.pad.ZeroPadding,
            });

            //console.log(encrypted.toString());
            return encrypted.toString();
        } catch (err) {
            console.log("[ERROR] : encryption error")
            console.log(err)
        }
    }
}