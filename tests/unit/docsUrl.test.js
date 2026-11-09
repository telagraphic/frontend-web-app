import { describe, expect, test } from "bun:test";
import { docsServer, docsUrl } from "../../server/developer/docsUrl.js";

describe("docs server address", () => {
  test("binds the IPv4 loopback the admin links use", () => {
    const server = docsServer();
    expect(docsUrl).toBe(`http://${server.host}:${server.port}/`);
    expect(server.host).toBe("127.0.0.1");
    expect(server.port).toBe(4321);
  });
});
