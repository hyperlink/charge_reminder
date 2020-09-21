import { Got } from 'got/dist/source';
import { ChargeState } from './ChargeState';
import { ChargeStateResponse } from './ChargeStateResponse';
import Config from './Config';
import { getAuthedRequest } from './teslaRequest';
import TokenManager from './TokenManager';
import Vehicle from './Vehicle';
import { VehicleListResponse } from './VehicleListResponse';
import { VehicleResponse } from './VehicleResponse';

export default class TeslaRepository {
  tokenManager: TokenManager;
  authedRequest: Got;

  constructor(config: Config) {
    this.tokenManager = new TokenManager(config);
  }

  getTokenManager(): TokenManager {
    return this.tokenManager;
  }

  async initiaize(): Promise<void> {
    this.authedRequest = getAuthedRequest(await this.tokenManager.getAccessToken());
  }

  async listVehicles(): Promise<VehicleListResponse> {
    return this.authedRequest.get('api/1/vehicles').json<VehicleListResponse>();
  }

  async wakeUp(vehicleId: string): Promise<Vehicle> {
    const { response } = await this.authedRequest.post(`api/1/vehicles/${vehicleId}/wake_up`).json<VehicleResponse>();
    return response;
  }

  async getChargeState(vehicleId: string): Promise<ChargeState>{
    try {
      const { response } = await this.authedRequest.get(`api/1/vehicles/${vehicleId}/data_request/charge_state`).json<ChargeStateResponse>();
      return response;
    } catch (error) {
      const responseBody = error.response.body;
      if (responseBody.error == 'vehicle unavailable: {:error=>\"vehicle unavailable:\"}') {
        throw new VehicleAsleepError();
      }
      throw error;
    }
  }
}

export class VehicleAsleepError extends Error { }