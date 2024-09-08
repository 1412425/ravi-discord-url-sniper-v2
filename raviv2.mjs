import WebSocket from 'ws';
import tls from 'tls';
import extractJsonFromString from 'extract-json-from-string';
import request from 'request-promise-native';
import axios from 'axios';
import https from 'https';
import got from 'got';
import phin from 'phin';
import supertest from 'supertest';
import centra from 'centra';
import bent from 'bent';
import fetch from 'node-fetch';
let ky;
import('ky').then(module => {
    ky = module.default;
});
async function fasterrequest(url, method, headers, body) {
    try {
        return new Promise((resolve, reject) => {
            const req = https.request(url, { method: method, headers: headers }, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ ok: true, status: res.statusCode, body: data });
                    } else {
                        resolve({ ok: false, status: res.statusCode, body: data });
                    }
                });
            });
            req.on('error', (e) => reject(e));
            if (body) {
                req.write(body);
            }
            req.end();
        });
    } catch (error) {
        throw error;
    }
}
const guilds = {};
const token = "token gir";
const apiUrl = 'https://canary.discord.com/api/';
const swid = "sunucu id gir";
let vanity;
const ws = new WebSocket('wss://gateway.discord.gg');
ws.on('open', () => {
    console.log('WebSocket connection opened');
});
ws.on('message', async (data) => {
    const decodedMessage = data.toString();
    const { d, op, t } = JSON.parse(decodedMessage);
    if (t === "GUILD_UPDATE") {
        const find = guilds[d.guild_id];
        if (find && find !== d.vanity_url_code) {
            const requestBody = JSON.stringify({ code: find });
            const tlsRequestHeader = [
                `PATCH /api/guilds/${swid}/vanity-url HTTP/1.2`,
                "Host: canary.discord.com",
                `Authorization: ${token}`,
                "Content-Type: application/json",
                `Content-Length: ${Buffer.byteLength(requestBody)}`,
                "", ""
            ].join("\r\n");
            vanity = find;
            const bentPatch = bent('PATCH', 'json', 200);
            const requests = [
                new Promise((resolve, reject) => {
                    tlsSocket.write(tlsRequestHeader + requestBody, 'utf-8', (err) => {
                        if (err) reject(err);
                        else resolve('TLS request sent');
                    });
                }),
                request({
                    method: 'PATCH',
                    uri: `${apiUrl}guilds/${swid}/vanity-url`,
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                    body: requestBody
                }).then(response => ({ source: 'request-promise-native', response })),
                axios.patch(
                    `${apiUrl}guilds/${swid}/vanity-url`,
                    { code: find },
                    { headers: { 'Authorization': token, 'Content-Type': 'application/json' } }
                ).then(response => ({ source: 'axios', response })),
                ky.patch(`${apiUrl}guilds/${swid}/vanity-url`, {
                    json: { code: find },
                    headers: { 'Authorization': token, 'Content-Type': 'application/json' }
                }).json().then(response => ({ source: 'ky', response })),
                fasterrequest(
                    `${apiUrl}guilds/${swid}/vanity-url`,
                    'PATCH',
                    {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(requestBody),
                    },
                    requestBody
                ).then(response => ({ source: 'fasterrequest', response })),
                got.patch(`${apiUrl}guilds/${swid}/vanity-url`, {
                    json: { code: find },
                    headers: { 'Authorization': token, 'Content-Type': 'application/json' }
                }).json().then(response => ({ source: 'got', response })),
                phin({
                    url: `${apiUrl}guilds/${swid}/vanity-url`,
                    method: 'PATCH',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json',
                    },
                    data: requestBody,
                    parse: 'json'
                }).then(response => ({ source: 'phin', response })),
                supertest('https://canary.discord.com')
                    .patch(`/api/guilds/${swid}/vanity-url`)
                    .set('Authorization', token)
                    .set('Content-Type', 'application/json')
                    .send({ code: find })
                    .then(response => ({ source: 'supertest', response })),
                centra(`${apiUrl}guilds/${swid}/vanity-url`, 'PATCH')
                    .header('Authorization', token)
                    .header('Content-Type', 'application/json')
                    .body({ code: find })
                    .send()
                    .then(res => res.json())
                    .then(response => ({ source: 'centra', response })),
                bentPatch(`${apiUrl}guilds/${swid}/vanity-url`, { code: find }, { Authorization: token, 'Content-Type': 'application/json' }).then(response => ({ source: 'bent', response })),
                fetch(`${apiUrl}guilds/${swid}/vanity-url`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': token,
                        'Content-Type': 'application/json'
                    },
                    body: requestBody
                }).then(response => response.json()).then(response => ({ source: 'fetch', response })),
            ];
            let firstResponseLogged = false;
            requests.forEach((req) => {
                req.then((res) => {
                    if (!firstResponseLogged) {
                        console.log(`First response (${res.source}):`, res.response);
                        firstResponseLogged = true;
                    }
                    console.log(`${res.source}:`, res.response);
                }).catch((error) => {
                    console.error(`Error in ${req.source}:`, error);
                });
            });
        }
    } else if (t === "READY") {
        d.guilds.forEach((guild) => {
            if (guild.vanity_url_code) {
                guilds[guild.id] = guild.vanity_url_code;
            }
        });
        console.log(guilds);
    }
    if (op === 10) {
        ws.send(JSON.stringify({
            op: 2,
            d: {
                token: token,
                intents: 1 << 0,
                properties: {
                    os: "GNOME",
                    browser: "Vivaldi",
                    device: "IoS",
                },
            },
        }));
        setInterval(() => ws.send(JSON.stringify({ op: 1, d: {}, s: null, t: "heartbeat" })), d.heartbeat_interval);
    } else if (op === 7) {
        return process.exit();
    }
});
ws.on('close', () => {
    console.log('WebSocket connection closed');
    process.exit();
});
const tlsSocket = tls.connect({ host: 'canary.discord.com', port: 443 });
setInterval(() => {
    tlsSocket.write(["GET / HTTP/1.1", "Host: discord.com", "", ""].join("\r\n"));
  }, 1500);
tlsSocket.on("error", (error) => process.exit());
tlsSocket.on("end", () => process.exit());
tlsSocket.on("data", async (data) => {
    const ext = extractJsonFromString(data.toString());
    const find = ext.find((e) => e.code) || ext.find((e) => e.message);
    if (find) {
        console.log(find);
        const requestBody = JSON.stringify({
            content: `||@everyone|| ${vanity}\n**excuse me**\nhttps://cdn.discordapp.com/attachments/1266124355637874718/1266411952368910397/ssstik.io_petrovaspearl_1722006528467.mp4?ex=66a50d8a&is=66a3bc0a&hm=2f9c3ee88248f3f04b761efb030fe203ea279a7e6e3515ddb0af7fdae7ffb0da&\n\`\`\`json\n${JSON.stringify(find)}\`\`\``,
        });
        const contentLength = Buffer.byteLength(requestBody);
        const requestHeader = [
            `POST  /api/channels/1263400847841300491/messages HTTP/1.2`,
            "Host: canary.discord.com",
            `Authorization: ${token}`,
            "Content-Type: application/json",
            `Content-Length: ${contentLength}`,
            "",
            "",
        ].join("\r\n");
        const request = requestHeader + requestBody;
        tlsSocket.write(request);
    }
});
