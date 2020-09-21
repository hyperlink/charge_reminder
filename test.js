'use strict';

const inquirer = require('inquirer');

const choices = [{ name: 'vehicle 1', value: 'v1id' }, { name: 'vehicle 2', value: 'v2id' }];

inquirer.prompt({ type: 'list', name: 'vehicle', message: 'select your vehicle to track', choices }).then(v => console.log(v));
