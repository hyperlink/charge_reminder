import got, { Got } from 'got';

const teslaRequest = got.extend({
  prefixUrl: 'https://owner-api.teslamotors.com',
  responseType: 'json',
  resolveBodyOnly: true
});

export default teslaRequest;

export function getAuthedRequest (token: string): Got {
  return teslaRequest.extend({
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}