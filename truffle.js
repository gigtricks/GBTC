var HDWalletProvider = require("truffle-hdwallet-provider");
var infura_apikey = "IVdMmxgFJAKp7YDNqX4p";
var mnemonic = "belt twin client unfair sad hospital combine doll hood ready inherit direct";

module.exports = {
    solc: {
        optimizer: {
            enabled: true,
            runs: 200
        }
    },
  networks: {
    development: {
       host: "localhost",
       port: 8545,
       network_id: "*",
       gas: 4612388
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,         // <-- If you change this, also set the port option in .solcover.js.
      gas: 0xfffffffffff, // <-- Use this high gas value
      gasPrice: 0x01      // <-- Use this low gas price
    },
      rinkeby: {
          provider: new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/"+infura_apikey),
          network_id: "*",
          gas:  4612388
      },
}
  // mocha: {
  //   reporter: 'mocha-multi-reporters',
  //   reporterOptions: {
  //       configFile: 'mocha-config.json'
  //   }
  // }
};
