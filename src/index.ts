import { decode as jwtDecode, verify as jwtVerify } from "jsonwebtoken";
import * as jwkToPem from "jwk-to-pem";
import fetch, { HeadersInit, Response } from "node-fetch";

interface IJamJwks {
  keys: Array<{
    kty: "EC";
    crv: "P-521";
    x: string;
    y: string;
    kid: string;
  }>;
}

async function checkRes(res: Response, expectedStatus: number) {
  if (res.status !== expectedStatus) {
    throw new Error(
      `${res.status} ${res.statusText}: ${(await res.text()) ||
        "<no error message>"}`
    );
  }
}

export default class JustAuthenticateMe {
  private appId: string;
  private jamApiUrl: string;
  private jsonHeaders: HeadersInit;
  private jwks: IJamJwks | null = null;

  constructor(appId: string) {
    this.appId = appId;
    this.jamApiUrl = `https://api.justauthenticate.me/${appId}/`;
    this.jsonHeaders = {
      "Content-Type": "application/json"
    };
  }

  async getJwks(): Promise<IJamJwks> {
    const res = await fetch(`${this.jamApiUrl}.well-known/jwks.json`);
    await checkRes(res, 200);
    return await res.json();
  }

  async verify(
    idToken: string,
    forceFetchKeys: boolean = false
  ): Promise<string> {
    if (this.jwks === null || forceFetchKeys) {
      this.jwks = await this.getJwks();
    }

    const { header: idTokenHeader } = jwtDecode(idToken, {
      complete: true
    }) as any;

    const key = this.jwks.keys.find(k => k.kid === idTokenHeader.kid);
    if (key === undefined) {
      const err = new Error(
        `kid not found: token was signed with kid "${idTokenHeader.kid}" but no key with that id was found in jwks`
      );
      (err as any).code = "unauthorized";
      throw err;
    }

    const pem = jwkToPem(key);
    try {
      const { email, token_use } = jwtVerify(idToken, pem, {
        algorithms: ["ES512"],
        audience: this.appId,
        ignoreExpiration: false,
        issuer: `https://api.justauthenticate.me/${this.appId}`
      }) as any;

      if (token_use !== "id") {
        throw new Error(
          `invalid token_use: Expected "id" but got "${token_use}"`
        );
      }

      return email;
    } catch (err) {
      (err as any).code = "unauthorized";
      throw err;
    }
  }

  async initAuth(email: string) {
    const res = await fetch(`${this.jamApiUrl}authenticate`, {
      method: "POST",
      headers: this.jsonHeaders,
      body: JSON.stringify({ email })
    });
    await checkRes(res, 200);
  }

  async refresh(refreshToken: string): Promise<string> {
    const res = await fetch(`${this.jamApiUrl}refresh`, {
      method: "POST",
      headers: this.jsonHeaders,
      body: JSON.stringify({ refreshToken })
    });
    await checkRes(res, 200);
    return (await res.json()).idToken;
  }

  async deleteRefreshToken(userIdToken: string, refreshToken: string) {
    const res = await fetch(`${this.jamApiUrl}refresh/${refreshToken}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${userIdToken}`
      }
    });
    await checkRes(res, 204);
  }

  async deleteAllRefreshTokens(userIdToken: string) {
    const res = await fetch(`${this.jamApiUrl}refresh`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${userIdToken}`
      }
    });
    await checkRes(res, 204);
  }
}
