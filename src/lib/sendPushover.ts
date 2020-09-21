import got from 'got';

export default async function sendMessage(auth: PushoverAuth, message: PushoverMessage): Promise<PushoverResponse> {
  return got.post('https://api.pushover.net/1/messages.json', {
    responseType: 'json',
    resolveBodyOnly: true,
    json: {
      ... auth,
      ... message
    }
  }).json<PushoverResponse>();
}

export interface PushoverMessage {
  message:  string;
  title?:    string;
  sound?:    string;
  device?:   string;
  priority?: number;
  url?: string;
  url_title?: string;
  timestamp?: string;
}

export interface PushoverAuth {
  token: string;
  user: string;
}

export interface PushoverResponse {
  status: number;
  request: string;
}
