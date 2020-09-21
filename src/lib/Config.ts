import Conf from 'conf';
import { PushoverAuth } from './sendPushover';
import TeslaToken from './TeslaToken';
import Vehicle from './Vehicle';

const VEHICLE_ID_KEY = 'vehicleId';
const VEHICLES_KEY = 'vehicles'
const TESLA_TOKEN_KEY = 'oauthToken';
const PUSHOVER_AUTH = 'pushoverAuth';

function getVehicleKey(vehicleId: string): string {
  return `${VEHICLES_KEY}.${vehicleId}`;
}

export default class Config {
  private config: Conf;
  private vehicleId: string;
  constructor() {
    this.config = new Conf();
  }

  clear(): void {
    this.vehicleId = null;
    this.config.clear();
  }

  savePushoverAuth(auth: PushoverAuth): void {
    this.config.set(PUSHOVER_AUTH, auth);
  }

  getPushoverAuth(): PushoverAuth {
    return this.config.get(PUSHOVER_AUTH) as PushoverAuth;
  }

  getTeslaToken(): TeslaToken {
    return this.config.get(TESLA_TOKEN_KEY) as TeslaToken
  }

  saveTeslaToken(token: TeslaToken): void {
    this.config.set(TESLA_TOKEN_KEY, token);
  }

  deleteTeslaToken(): void {
    this.config.delete(TESLA_TOKEN_KEY);
  }

  getSelectedVehicleId(): string {
    if (this.vehicleId != null) {
      return this.vehicleId;
    }
    return this.vehicleId = this.config.get(VEHICLE_ID_KEY) as string;
  }

  saveSelectedVehicleId(vehicleId: string): void {
    this.vehicleId = vehicleId;
    this.config.set(VEHICLE_ID_KEY, vehicleId);
  }

  getVehicle(vehicleId: string): Vehicle {
    return this.config.get(getVehicleKey(vehicleId)) as Vehicle;
  }

  saveVehicle(vehicleId: string, vehicle: Vehicle): void {
    this.config.set(getVehicleKey(vehicleId), vehicle);
  }
}
