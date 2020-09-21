import inquirer from 'inquirer';
import Debug from 'debug';
import meow from 'meow';

const debug = Debug('charge_reminder:Setup');

import TeslaRepository from './lib/TeslaRepository';
import Spinner from './lib/Spinner';
import Vehicle from './lib/Vehicle';
import * as _ from 'lodash';
import Config from './lib/Config';
import sendMessage, { PushoverAuth } from './lib/sendPushover';

const config = new Config();
const spinner = new Spinner();

const tesla = new TeslaRepository(config);
const tokenManager = tesla.getTokenManager();

const cli = meow(`
    Usage
      $ charge_reminder

    Options
      --revoke, -r  revoke token and delete all data
`, {
  flags: {
    revoke: {
      type: 'boolean',
      alias: 'r'
    },
    pushover: {
      type: 'boolean'
    }
  }
});

debug('cli.flags', cli.flags);

if (cli.flags.pushover) {
  setupPushover();
} else if (cli.flags.revoke) {
  revoke().catch(error => console.error('revoke error', error));
} else {
  setup().catch(error => console.error(error, error.options, error.response));
}

async function revoke() {
  if (!tokenManager.hasToken()) {
    console.log('No access token to revoke');
  }
  console.log('This command will revoke your Tesla access token and all data associated with this app.')
  const response = await inquirer.prompt([{
    name: 'revokeAccessToken',
    message: 'Revoke access token?',
    type: 'confirm',
    default: true
  },
  {
    name: 'deleteAllData',
    message: 'Delete all vehicle data from the app?',
    type: 'confirm',
    default: true
  }
  ]);
  debug('response', response);

  if (response.revokeAccessToken) {
    debug('revoking token...');
    await spinner.promise(tokenManager.revokeToken(), 'Revoking token');
    debug('token revoked')
  }

  if (response.deleteAllData) {
    config.clear();
    spinner.succeed('App data cleared!');
  }
}

function validate(input) {
  return input !== '';
}

function promptForUserAccount() {
  return inquirer.prompt([
    {
      message: 'E-mail Address',
      name: 'email',
      validate
    },
    {
      message: 'Password',
      name: 'password',
      type: 'password',
      mask: true,
      validate
    }
  ]);
}

async function setupPushover() {
  const pushoverData: PushoverAuth = await inquirer.prompt([
    {
      message: 'Please enter your Pushover Application API token',
      name: 'token',
      validate
    },
    {
      message: 'Please enter your User Key',
      name: 'user',
      validate
    }
  ]);

  try {
    await spinner.promise(sendMessage(pushoverData, {
      title: 'Test Message',
      message: 'This is a test message'
    }), 'Sending a pushover test mesasge');
    config.savePushoverAuth(pushoverData);
    spinner.succeed('Token saved.');
  } catch(error) {
    console.error(`There's error sending pushover test ${error.message}. Please double check tokens.`);
  }
}

async function setup() {
  if (tokenManager.hasToken()) {
    if (!tokenManager.isTokenExpired()) {
      console.log('Tesla token is not expired. You are good to go.');
      return;
    } else {
      try {
        await tokenManager.refreshToken();
        console.log('Successfully refreshed token. Try again if issue persists revoke token and create a new token.');
      } catch (error) {
        console.error('Encountered an error while refreshing the token.', error.message);
        debug('token refresh error', error);
      }
    }
  } else {
    console.log(`
    Please enter your Tesla.com credentials when prompted.
    Your credentials are used to request a secure API token from Tesla.com
    Your credentials will NEVER be stored in this app.
    API token used by the app can be revoked at anytime by running the --revoke command.
  `);
    const info = await promptForUserAccount();
    await tokenManager.requestNewToken(info);
    await tesla.initiaize();

    const vehicles = await spinner.promise(tesla.listVehicles(), 'Getting list of vehicles...');
    let selectedVehicle: Vehicle;

    if (vehicles.count > 1) {
      console.log('You have multiple vehicles congratulations!');
      const choices: InquirerChoice[] = [];

      for (const vehicle of vehicles.response) {
        choices.push({
          name: vehicle.display_name,
          value: vehicle.id_s
        });
      }
      const { vehicleId } = await inquirer.prompt({
        type: 'list',
        name: 'vehicleId',
        message: 'select your vehicle to track',
        choices
      });
      selectedVehicle = _.find(vehicles.response, { id_s: vehicleId });
    } else {
      selectedVehicle = vehicles.response[0];
    }

    config.saveSelectedVehicleId(selectedVehicle.id_s);
    config.saveVehicle(selectedVehicle.id_s, selectedVehicle);
    spinner.succeed('Finished setting up ' + selectedVehicle.display_name);
  }
}

interface InquirerChoice {
  name: string;
  value: string;
}
