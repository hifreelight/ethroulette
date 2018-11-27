var Roscoin = artifacts.require("Roscoin");
var Roulette = artifacts.require("Roulette");

module.exports = (deployer) => {
  deployer.deploy(Roscoin).then(() => {
    return deployer.deploy(Roulette, Roscoin.address);
  });
};
// var BTRoulette = artifacts.require("BTRoulette");
// module.exports = (deployer) => {
//   deployer.deploy(BTRoulette).then(() => {
//     return true;
//   });
// };
