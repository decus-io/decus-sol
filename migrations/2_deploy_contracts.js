const DecusToken = artifacts.require("DecusToken");

module.exports = function(deployer) {
  deployer.deploy(DecusToken);
};
