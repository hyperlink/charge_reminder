import { ChargingState } from "./ChargeState";

export default interface Vehicle {
  id: string;
  vehicle_id: string;
  vin: string;
  display_name: string;
  option_codes: string;
  color: null;
  tokens: string[];
  state: ChargingState;
  in_service: null;
  id_s: string;
  calendar_enabled: boolean;
  backseat_token: null;
  backseat_token_updated_at: null;
}
