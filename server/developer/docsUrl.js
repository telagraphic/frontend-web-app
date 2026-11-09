// 127.0.0.1, not localhost. Node binds `localhost` to ::1 only, and the admin links use this IPv4 address.
const docsUrl = "http://127.0.0.1:4321/";

export { docsUrl };

export function docsServer() {
  const url = new URL(docsUrl);
  return {
    host: url.hostname,
    port: Number(url.port),
  };
}
