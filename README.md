# Tesla Charge ⚡️ Reminder

Get a reminder to plug in 🔌 your 🚘 car with this CLI app. It will probe your vehicle's charging state and will send a [pushover](https://pushover.net/) notification when it detects your car is unplugged. Recommend running this in a nightly cronjob.

![CLI](imgs/charge_reminder.gif)

## Requirements

* Pushover account (**FREE** mobile notification app)
* NodeJS 14.5+


## Features

* ⌚️ Send pushover [notifcation](imgs/apple_watch.png) with plugged in state, charge level and miliage remaining in your car
* CLI setup to generate Tesla access token from provided credentials (**NOTE**: credentials are sent to Tesla.com for an access token and is not stored in the application)
* 📅 Will automatically renew Tesla token with in ten days of expiration (no problem if you run it at least once a day) this is because tokens will only lasts about a month
* 🔐 Tesla token is full access to your car and it's only stored on the computer running the app


## Setup

#### Get Pushover

* Download pushover mobile app and sign up for an account
* [Create an application](https://pushover.net/apps/build) or use an existing one
* Make note of the pushover user key and Application API token

#### Install the CLI app.

```bash
npm install -g @hyperlink/tesla-charge-reminder
charge-reminder-setup
```

## Usage

charge-reminder