const path = require("path");
const provider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const secret = JSON.parse(
  fs.readFileSync('secret.json').toString().trim()
);

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  compilers: {
    solc: {
      version: '0.8.0'
    }
  },
  // start from 0th private key, generate 3 addresses
  networks: {
    ropsten: {
      provider: () =>
        new provider(
          secret.privateKeys,
          `wss://eth-ropsten.alchemyapi.io/v2/${secret.rinkebyInfuraKey}`
        )
      ,
      gasLimit: '300000',
      confirmations: 0,
      skipDryRun: true,
      network_id: '*'
    },
  }
};
