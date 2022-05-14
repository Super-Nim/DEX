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
    rinkeby: {
      provider: () =>
        new provider(
          secret.privateKeys,
          'https://mainnet.infura.io/v3/3b74f01d6d4a4cc9b9cd553610af7817'
        )
      ,
      gasLimit: '300000',
      confirmations: 2,
      skipDryRun: true,
      network_id: '*'
    },
  }
};
