var BTRoulette = artifacts.require("BTRoulette");

var BTRoulette = artifacts.require("BTRoulette");
module.exports = (deployer) => {
  deployer.deploy(BTRoulette).then(() => {
    return true;
  });
};
