var GigToken = artifacts.require("./GigToken.sol");
var PrivateSale = artifacts.require("./PrivateSale.sol");
var CrowdSale = artifacts.require("./CrowdSale.sol");

module.exports = function (deployer, network, accounts) {
    if (network === 'rinkeby') {

        var privateSale, crowdSale, token;
        deployer.then(function () {
            return deployer.deploy(GigToken, false)
        })
            .then(function (instance) {
                token = instance;
                return deployer.deploy(CrowdSale, GigToken.address, "0x4dd93664e39fbb2a229e6a88eb1da53f4ccc88ac", "350000000000000000000000000", 24800, 1527840000, 1535616000, "42071000");
            })
            .then(function (instance) {
                crowdSale = instance;
                deployer.deploy(PrivateSale, GigToken.address, "0x4dd93664e39fbb2a229e6a88eb1da53f4ccc88ac", 1523318400, 1526371200, "350000000000000000000000000", "42071000");
            })
            .then(function (instance) {
                privateSale = instance;

                token.addMinter(crowdSale.address);
                token.setICO(crowdSale.address);
                crowdSale.setAllowedMultivest(signAddress)
                token.addMinter(privateSale.address)
                token.setPrivateSale(privateSale.address)
                privateSale.setAllowedMultivest(signAddress)
                privateSale.setTokenContract(token.address)
                crowdSale.setTokenContract(token.address)
                // token.setAllocationContract(allocations.address);
                // token.addMinter(allocations.address);
                token.freezing(false);
                // allocations.setICO(crowdSale.address)
            })

    }
};
