const ChequeVerification = artifacts.require("ChequeVerification");

module.exports = function(deployer) {
  deployer.deploy(ChequeVerification);
};
