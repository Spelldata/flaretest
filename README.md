# flaretest

## Example

```javascript
import FlareTest from "flaretest";

const flaretest = new FlareTest("example.com", {
  userAgents: {
    desktop: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3163.100 Safari/537.36",
    mobile: "Mozilla/5.0 (Linux; Android 7.1.2; Kingbox Build/NHG47K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/73.0.3653.0 Safari/537.36",
  }
});

flaretest.run([
  {
    paths: [
      "/foo/bar",
      "/boo",
      "/woo.css",
    ],
    cached: true,
    gzip: true,
    redirectHttps: true,
    status: 200,
  },
  {
    paths: [
      "/aaa",
    ],
    cached: false,
    gzip: false,
    redirectHttps: false,
    status: 301,
    redirectTo: "/dest"
  },
  {
    paths: [
      "/path-with-query",
    ],
    cached: true,
    gzip: true,
    redirectHttps: true,
    status: 200,
    cacheLevel: "standard", // or ignoreQueryString or noQueryString
  },
]);
```
