import { createServer as createHttpServer, Server as _Server } from "http";
import { createServer as createHttpsServer } from "https";
import express = require("express");

const tlsKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAwjgk3HY4a1J/NMXzlJ36FpKbX7T1usHIFxzDkYqgYEMKepDq
9Lw8aA9F/m27AEecJKfCzlLvnP/64pYT9ljekbEVqf3+mokID3GitldNi641Slgj
NHgNrEsoL8eyQCCIEiX3B13VlGbhbIWXwnu1H2nL1k4G/q0/ZbIXbzYH0o7MazJl
Ai4Zmyifyde6yxEudns1ku5pxznuy9rlcOUanAvGSg28hnKOt975kWrnyynZxx4V
9RxQfta6y04tSmRn1m58K6e+AD9Dt/vBT2r6649yM7lsUMuQR2B4R2SeS1dgz7kG
QBHt1wlv/pxo9TuKVYXqmGjoW/FdyMuC3bi6PwIDAQABAoIBADSycx32XbyQ977j
7wFmE9NIGCxRt1Li/V14CoBU8srrpc43v+iDoohBjKZKM7ERvQYdFrhQvH8G3ZXZ
TrVKy6kQOWaUah6YC73VAWckLQA3VnJDk9nKsTsMcWz1bCIGMaVq86nmBetsNsHx
RYoZcr2BQTN2nGNBsq/vMHiWWm0Ao8bZWCsb5p0Tnp/mIHuseUT9wKSnNAvaL8M8
0wsyUbrWWOFhVVWrK7clnU1Um/73pSRH5JVCx10dyMYP5MoO/l2W26GiM5V1tvhD
r8JZeHVUOEIaaornvOCeZ65WDNZa3rb8VKrKaITVFUSmnvMvSmhyUm4Rr0SpRoo7
s1LczHECgYEA/7LxQLk+jn2ROXsUp5KkZ1jXcw88ZsL4DJCr3o2IeTpWbrfCWLwK
ZsPlnRo6GmZs1m3NhAjUNSs+Is1dw+5f/9S1G/47eATTpJ2diFsx19rUl+zyKk1J
VWQ8gb5KqBtK/emZQR3/gCfQ7AGJVjVnuTrphZpJZvFxRJTqhf992oMCgYEAwnKs
jeulFpq5HuhVe5k2uC4JfceBZhuE1VcTaQPSJpdKlMLHcwH/yitLneYaaTML559E
aCgCA+PyzeUcG3mBKTNRLzjT0yjsdvczwJG7na8VIAmkCNcbCdjt4pmakFcnWaEt
n+MsF9WM2Wv1ZKst4z9XKcJu5ddyJTALwIJvhJUCgYB5V/UPbxmVy1covRUfNQMa
HFoaO0fByJKoe9tkQSxbw2iTIFd1fr8854hG1tRuBN9vnyohl4MFPGE/aNAvlCcw
pEPSZgLYwQmjHD1PIV/0/N9YvdRqaMT9ZhUkySZqwpEDEGFvOoouyjZmWZBQPgXc
LG33vjFJThkfn7/wGUAjewKBgBGyuEvuj8cf7AuJIAaw6k8XOZvuJbPye0OjukuL
onwKtyoVFGw+WVbAXBCSGgNLNyEs2OAWDCDohXgCC23gwEXMuu3uYTFN/z/QvjAf
05DFl8mjtv9q/LYHvZcrXesXU6iPyAROe/vrXveHIP25quKNKFTPsqJO2r/RwLAT
7yyFAoGAKIhZwnd+Fe0egqS7GgsjdXIDUSLR5+MOGIxEijT+zzpQmxOHtaKVYk5t
n3kXp/4OCY7Xoq6Z5etpl3shYVybglVTyWigV1D20Xaepp2yjdx/WONBh25dFcxO
zZaHVCY/QLxf87dAOHcIpnKqvGv/LAh47dZyl/l6iS2l68/pUn8=
-----END RSA PRIVATE KEY-----`;
const tlsCert = `-----BEGIN CERTIFICATE-----
MIIDjDCCAnQCCQCPSoFQTDW/XjANBgkqhkiG9w0BAQsFADCBhzELMAkGA1UEBhMC
SlAxDjAMBgNVBAgMBVRva3lvMRMwEQYDVQQHDApDaGl5b2RhLWt1MRIwEAYDVQQK
DAlTcGVsbGRhdGExEjAQBgNVBAMMCWxvY2FsaG9zdDErMCkGCSqGSIb3DQEJARYc
anVtcGVpLm9nYXdhQHNwZWxsZGF0YS5jby5qcDAeFw0yMDAxMzEwODMyNTNaFw0z
MDAxMjgwODMyNTNaMIGHMQswCQYDVQQGEwJKUDEOMAwGA1UECAwFVG9reW8xEzAR
BgNVBAcMCkNoaXlvZGEta3UxEjAQBgNVBAoMCVNwZWxsZGF0YTESMBAGA1UEAwwJ
bG9jYWxob3N0MSswKQYJKoZIhvcNAQkBFhxqdW1wZWkub2dhd2FAc3BlbGxkYXRh
LmNvLmpwMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwjgk3HY4a1J/
NMXzlJ36FpKbX7T1usHIFxzDkYqgYEMKepDq9Lw8aA9F/m27AEecJKfCzlLvnP/6
4pYT9ljekbEVqf3+mokID3GitldNi641SlgjNHgNrEsoL8eyQCCIEiX3B13VlGbh
bIWXwnu1H2nL1k4G/q0/ZbIXbzYH0o7MazJlAi4Zmyifyde6yxEudns1ku5pxznu
y9rlcOUanAvGSg28hnKOt975kWrnyynZxx4V9RxQfta6y04tSmRn1m58K6e+AD9D
t/vBT2r6649yM7lsUMuQR2B4R2SeS1dgz7kGQBHt1wlv/pxo9TuKVYXqmGjoW/Fd
yMuC3bi6PwIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQC/VWspWNfuIyhXSgxccTCN
Dc3Qeoevpo6YmQBKFyuwM3WCvwDSbGzEbG/WlhTw+D+6oORTmPPGlNJsgNXsJzDo
OztwWAEO1pZQJvrNdmbvQzzjvP8qsy/kjuzYUZh+NiHdFEorBfpfQANVb0pw94nd
3kqri8e6hDVvp6ksOmuL57Hj7lmhoFP9Yc35SijJ4ovpjpxyV7gRfuP03guhI5NB
opHvvcCJyXmmtePN9eQtQjrrSDHLAmArMIJTyEbfBphLYYm0i04GoaXQ35tY+QVw
9R8s0ZL4EoRWeLkp7ggbScQ7m0BN6fVE5ODTdc/rhIF5//gBmwOb2kGr+bnWkR4N
-----END CERTIFICATE-----`;

export class Server {
  private httpServer: _Server;
  private httpsServer: _Server;
  private port: {
    http: number,
    https: number,
  };
  /** If it is just after cache purged and any cached contents return with CF-Cache-Status: MISS */
  private purged = true;
  private accessed: { [key: string]: boolean } = {};

  constructor(port: { http: number, https: number }) {
    this.port = port;
  }

  async start(): Promise<void> {
    const app = express();
    const port = this.port;

    app.get("/cached-https-200", (req, res) => {
      if (req.protocol === "http") {
        return res.redirect(301, `https://${req.hostname}${req.url}`);
      }

      res.set({
        "CF-Cache-Status": "HIT",
      });
      res.statusCode = 200;
      res.send("content");
    });

    app.get("/cached_miss_then_hit-https-200", (req, res) => {
      if (req.protocol === "http") {
        return res.redirect(301, `https://${req.hostname}${req.url}`);
      }

      res.set({
        "CF-Cache-Status": this.purged ? "MISS" : "HIT",
      });
      this.purged = false;

      res.statusCode = 200;
      res.send("content");
    });

    app.get("/nocache-https-200", (req, res) => {
      if (req.protocol === "http") {
        return res.redirect(301, `https://${req.hostname}${req.url}`);
      }

      /* No CF-Cache-Status header */

      res.statusCode = 200;
      res.send("content");
    });

    app.get("/nocache_always_miss-https-200", (req, res) => {
      if (req.protocol === "http") {
        return res.redirect(301, `https://${req.hostname}${req.url}`);
      }

      res.set({
        "CF-Cache-Status": "MISS",
      });

      res.statusCode = 200;
      res.send("content");
    });

    app.get("/nocache_dynamic-https-200", (req, res) => {
      if (req.protocol === "http") {
        return res.redirect(301, `https://${req.hostname}${req.url}`);
      }

      res.set({
        "CF-Cache-Status": "DYNAMIC",
      });

      res.statusCode = 200;
      res.send("content");
    });

    app.get("/cached-nohttps-200", (req, res) => {
      /* No HTTPS redirect */

      res.set({
        "CF-Cache-Status": "HIT",
      });
      res.statusCode = 200;
      res.send("content");
    });

    app.get("/cached_miss_then_hit-nohttps-200", (req, res) => {
      /* No HTTPS redirect */

      res.set({
        "CF-Cache-Status": this.purged ? "MISS" : "HIT",
      });
      this.purged = false;

      res.statusCode = 200;
      res.send("content");
    });

    app.get("/nocache-nohttps-200", (req, res) => {
      /* No CF-Cache-Status header */
      /* No HTTPS redirect */

      res.statusCode = 200;
      res.send("content");
    });

    app.get("/nocache_always_miss-nohttps-200", (req, res) => {
      /* No HTTPS redirect */

      res.set({
        "CF-Cache-Status": "MISS",
      });

      res.statusCode = 200;
      res.send("content");
    });

    app.get("/nocache_dynamic-nohttps-200", (req, res) => {
      /* No HTTPS redirect */

      res.set({
        "CF-Cache-Status": "DYNAMIC",
      });

      res.statusCode = 200;
      res.send("content");
    });

    app.get("/cached-https-500", (req, res) => {
      if (req.protocol === "http") {
        return res.redirect(301, `https://${req.hostname}${req.url}`);
      }

      res.set({
        "CF-Cache-Status": "HIT",
      });
      res.statusCode = 500;
      res.send("content");
    });

    app.get("/cache-level-standard", (req, res) => {
      const cacheKey = req.get("User-Agent") + ":" + req.originalUrl;
      if (this.accessed[cacheKey] === true) {
        res.set({ "CF-Cache-Status": "HIT" });
      } else {
        this.accessed[cacheKey] = true;
        res.set({ "CF-Cache-Status": "MISS" });
      }

      res.send("content");
    });

    app.get("/cache-level-ignore-query-string", (req, res) => {
      const cacheKey = req.get("User-Agent") + ":" + req.path;
      if (this.accessed[cacheKey] === true) {
        res.set({ "CF-Cache-Status": "HIT" });
      } else {
        this.accessed[cacheKey] = true;
        res.set({ "CF-Cache-Status": "MISS" });
      }

      res.send("content");
    });

    const self = this;

    await Promise.all([
      new Promise(resolve => {
        self.httpServer = createHttpServer(app).listen({ port: port.http }, () => resolve());
      }),
      new Promise(resolve => {
        self.httpsServer = createHttpsServer({
          key: tlsKey,
          cert: tlsCert,
        }, app).listen({ port: port.https }, () => resolve());
      }),
    ]);
  }

  async close(): Promise<void> {
    const self = this;

    await Promise.all([
      new Promise(resolve => {
        self.httpServer.close(() => resolve());
      }),
      new Promise(resolve => {
        self.httpsServer.close(() => resolve());
      }),
    ]);
  }
}
