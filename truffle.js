var HDWalletProvider = require("truffle-hdwallet-provider");
require('dotenv').config();

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(`${process.env.MNEMONIC}`, `https://rinkeby.infura.io/${process.env.INFURA_API_KEY}`)
      },
      network_id: 4,
      gasPrice: 10e9
    },
    ropsten: {
      provider: () => {
        return new HDWalletProvider(`${process.env.MNEMONIC}`, `https://ropsten.infura.io/${process.env.INFURA_API_KEY}`)
      },
      network_id: 3,
      gasPrice: 2*10e9
    }
  }
};
