#!/usr/bin/env node

import Debug from 'debug';
import ms from 'ms';
import TeslaRepository, { VehicleAsleepError, VehicleNotFoundError } from './lib/TeslaRepository';
import sendMessage from './lib/sendPushover';
import Vehicle from './lib/Vehicle';
import Spinner from './lib/Spinner';
import { MissingTokenError } from './lib/TokenManager';
import Config from './lib/Config';

const debug = Debug('charge_reminder');

const config = new Config();

const tesla = new TeslaRepository(config);
const spinner = new Spinner();

const WAKE_UP_DELAY_MS = ms('15s');
const pushoverAuth = config.getPushoverAuth();

const CHECK_CHARGE_STATE_MESSAGE = 'Checking charge status';
const WAKING_UP_MESSAGE = 'Waking up vehicle';

const vehicleId = config.getSelectedVehicleId();
let vehicle: Vehicle;

async function start() {
  try {
    await tesla.initiaize();
  } catch (error) {
    if (error instanceof MissingTokenError) {
      console.log('Missing API token. Please run setup.');
      return;
    }
    throw error;
  }

  if (vehicleId == null) {
    debug('missing vehicleId');
  } else {
    debug(`vehicleId is ${vehicleId}`);
  }
  try {
    vehicle = config.getVehicle(vehicleId);
    const status = await spinner.promise(checkChargeState(vehicleId), CHECK_CHARGE_STATE_MESSAGE);
    await reportChargeState(status);
  } catch (error) {
    if (error instanceof VehicleAsleepError) {
      console.log(`  ${vehicle.display_name} is asleep 😴. Attempting to wake up ⏰.`);
      await spinner.promise(wakeUpVehicle(), WAKING_UP_MESSAGE);
      const status = await spinner.promise(checkChargeState(vehicleId), CHECK_CHARGE_STATE_MESSAGE);
      reportChargeState(status);
    } else if (error instanceof VehicleNotFoundError) {
      console.error(`${vehicle.id_s} is invalid id for ${vehicle.display_name}. Tesla API reports "not found".

To select a vehicle run "charge-reminder-setup -s"`);
    } else {
      throw error;
    }
  }
}

start().catch(error => console.error('app error', error, error.options));

async function isVehicleAwake (): Promise<boolean> {
  vehicle = await tesla.wakeUp(vehicleId);
  config.saveVehicle(vehicleId, vehicle);
  return vehicle.state !== 'asleep';
}

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface ChargeStatus {
  needsPluggedIn: boolean;
  statusText: string;
}

async function reportChargeState({ statusText, needsPluggedIn } : ChargeStatus) {
  if (needsPluggedIn) {
    console.log(`You need to plug in your car. ${statusText}`);
    await sendMessage(pushoverAuth, {
      title: 'Your vehicle is not plugged in!',
      message: statusText
    });
  } else {
    console.log(statusText);
  }
}

const MAX_WAKE_UP_ATTEMPTS = 5;
async function wakeUpVehicle(): Promise<void> {
  let attempts = 0;
  let isAwake = false;
  do {
    isAwake = await isVehicleAwake();
    if (isAwake) break;
    if (++attempts > MAX_WAKE_UP_ATTEMPTS) {
      throw new Error(`Unable to wake up vehicle after ${attempts}`);
    }
    debug('sleeping for', WAKE_UP_DELAY_MS);
    await delay(WAKE_UP_DELAY_MS);
    spinner.text = `${WAKING_UP_MESSAGE} attempt ${attempts}`;
  } while (true);
}

async function checkChargeState(vehicleId: string): Promise<ChargeStatus> {
  debug('using', vehicleId);
  const chargeState = await tesla.getChargeState(vehicleId);
  debug('chargeState response', chargeState);
  /* https://www.reddit.com/r/teslamotors/comments/df2s1j/reminder_cold_weather_reduces_displayed_range/ */
  const statusText = `${vehicle.display_name} 🔌 status ${chargeState.charging_state.toLocaleLowerCase()}. Battery 🔋 level at ${chargeState.usable_battery_level}% with estimated range of ${chargeState.battery_range} miles.`;
  if (chargeState.charging_state == 'Disconnected') {
    return {
      needsPluggedIn: true,
      statusText
    };
  }
  return {
    needsPluggedIn: false,
    statusText
  };
}
