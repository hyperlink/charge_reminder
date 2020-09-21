import TeslaToken from './TeslaToken';
import Debug from 'debug';
import { formatDistanceToNow, addDays } from 'date-fns'
import teslaRequest from './teslaRequest';
import Config from './Config';

const client_id = '81527cff06843c8634fdc09e8ac0abefb46ac849f38fe1e431c2ef2106796384';
const client_secret = 'c7257eb71a564034f9419ee651c7d0e5f7aa6bfbd18bafb5c5c033b093bb2fa3';

const debug = Debug('charge_reminder:TokenManager');


export interface TeslaCreds {
  email: string;
  password: string;
}

export default class TokenManager {
  private config: Config;
  private token: TeslaToken;
  private readonly renewDays = 10;

  constructor(config: Config) {
    this.config = config;
    this.token = config.getTeslaToken();

    if (this.token) {
      const tokenCreatedDate = new Date(this.token.created_at * 1000);
      debug(`token created ${formatDistanceToNow(tokenCreatedDate, { addSuffix: true })}`);
      const tokenExpiresDate = new Date((this.token.created_at + this.token.expires_in) * 1000);
      debug('token expires', formatDistanceToNow(tokenExpiresDate, { addSuffix: true }));
    }
  }

  private async fetchToken(email: string, password: string): Promise<TeslaToken> {
    const json = {
      password,
      email,
      client_secret,
      client_id,
      grant_type: 'password',
    };
    return teslaRequest.post('oauth/token', { json }).json<TeslaToken>();
  }

  private async fetchTeslaRefreshToken(refreshToken: string): Promise<TeslaToken> {
    return teslaRequest.post('oauth/token?grant_type=refresh_token', {
      json: {
        client_secret,
        client_id,
        refresh_token: refreshToken
      }
    }).json<TeslaToken>();
  }

  private assertToken() {
    if (!this.hasToken()) {
      throw new MissingTokenError('Missing access token.');
    }
  }

  private getTokenExpirationDate(): Date {
    this.assertToken();
    return new Date((this.token.created_at + this.token.expires_in) * 1000);
  }

  async requestNewToken({ email, password }: TeslaCreds): Promise<string> {
    this.token = await this.fetchToken(email, password);
    this.config.saveTeslaToken(this.token);
    return this.token.access_token;
  }

  async revokeToken(): Promise<void> {
    this.assertToken();
    await teslaRequest.post('oauth/revoke', {
      json: {
        token: this.token.access_token
      }
    }).json();
    this.config.deleteTeslaToken();
    this.token = null;
  }

  async refreshToken(): Promise<void> {
    this.assertToken();
    const token = await this.fetchTeslaRefreshToken(this.token.refresh_token);
    this.config.saveTeslaToken(token);
    this.token = token;
  }

  isTokenExpired(): boolean {
    return this.getTokenExpirationDate() < new Date();
  }

  async getAccessToken(): Promise<string> {
    if (this.hasToken()) {
      if (this.isTokenExpired()) {
        throw new ExpiredTokenError('Token expired on ' + this.getTokenExpirationDate());
      }
      const daysFromNow = addDays(new Date(), this.renewDays);
      debug(`${this.renewDays} days from now is ${daysFromNow}`);
      debug(`Token is not expired yet. Expiration date is ${this.getTokenExpirationDate()}`);
      const tokenExpiration = this.getTokenExpirationDate();
      if (daysFromNow > tokenExpiration) {
        debug(`Token will expire ${this.renewDays} days from now. Refreshing token.`);
        await this.refreshToken();
      } else {
        debug('Using existing token.');
      }
      return this.token.access_token;
    }
    this.assertToken();
  }

  hasToken(): boolean {
    return this.token != null;
  }
}

export class MissingTokenError extends Error {}
export class ExpiredTokenError extends Error {}