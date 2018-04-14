var
    ICO = artifacts.require("./test/TestICO.sol"),
    GigToken = artifacts.require("./test/TestGig.sol"),
    GigAllocation = artifacts.require("./test/TestGigAllocation.sol"),

    Utils = require("./utils"),
    BigNumber = require('bignumber.js'),

    precision = new BigNumber("1000000000000000000"),
    usdPrecision = new BigNumber("100000"),
    icoSince = parseInt(new Date().getTime() / 1000 - 3600 * 2),
    icoTill = parseInt(new Date().getTime() / 1000) - 3600,
    monthSeconds = 2629744,
    signAddress = web3.eth.accounts[0],
    etherHolder = web3.eth.accounts[5],
    wrongSigAddress = web3.eth.accounts[7],
    rewardsAddress = web3.eth.accounts[8];

var abi = require('ethereumjs-abi'),
    BN = require('bn.js');

function makeTransactionKYC(instance, sign, address, value) {
    'use strict';
    var h = abi.soliditySHA3(['address'], [new BN(address.substr(2), 16)]),
        sig = web3.eth.sign(sign, h.toString('hex')).slice(2),
        r = `0x${sig.slice(0, 64)}`,
        s = `0x${sig.slice(64, 128)}`,
        v = web3.toDecimal(sig.slice(128, 130)) + 27;

    var data = abi.simpleEncode('multivestBuy(address,uint8,bytes32,bytes32)', address, v, r, s);

    return instance.sendTransaction({value: value, from: address, data: data.toString('hex')});
}

async function deploy() {
    const token = await GigToken.new(false);
    const ico = await ICO.new(
        token.address, //_token
        etherHolder, //_etherHolder
        new BigNumber('350000000').mul(precision).valueOf(),//_maxTokenSupply
        24800,
        icoSince, //_startTime
        icoTill,//_endTime
        150000000
    );

    await token.addMinter(ico.address);
    await token.setICO(ico.address);
    await ico.setAllowedMultivest(signAddress);

    const allocations = await GigAllocation.new(token.address, ico.address, new BigNumber('150000000000000000000000000'),
        web3.eth.accounts[5],web3.eth.accounts[6],web3.eth.accounts[7],web3.eth.accounts[8])
    await token.setAllocationContract(allocations.address);
    await token.addMinter(allocations.address);
    return {token, ico, ico, ico, allocations};
}

contract('Allocations', function (accounts) {

    it('deploy & check constructor info & setGigToken & setICO', async function () {
        const {token, privateico, preico, ico, allocations} = await deploy();

        await Utils.checkState({allocations}, {
            allocations: {
                token: token.address,
                ico: ico.address,
                remainingTokens: new BigNumber('150000000000000000000000000').valueOf()
            }
        });

        await allocations.setGigToken(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocations.setGigToken(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocations.setGigToken(accounts[2])
            .then(Utils.receiptShouldSucceed);

        await allocations.setICO(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocations.setICO(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocations.setICO(accounts[2])
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({allocations}, {
            allocations: {
                token: accounts[2],
                ico: accounts[2],
                remainingTokens: new BigNumber('150000000').mul(precision).valueOf()
            }
        });

    });

    it('check setAllocation advisors & team & allocate', async function () {
        const {token, privateico, preico, ico, allocations} = await deploy();

        await Utils.checkState({allocations}, {
            allocations: {
                token: token.address,
                ico: ico.address,
                remainingTokens: new BigNumber('150000000').mul(precision).valueOf()
            }
        });

        await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
            accounts[0],
            accounts[1],
            accounts[2],
        ], {from: accounts[5]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await allocations.setAllocation(new BigNumber('0').mul(precision).valueOf(),[
            accounts[0],
            accounts[1],
            accounts[2],
        ])
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await allocations.testChangeRemainingTokens(0);
        await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
            accounts[0],
            accounts[1],
            accounts[2],
        ])
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocations.testChangeRemainingTokens(new BigNumber('150000000').mul(precision).valueOf());

        await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[])
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await allocations.testChangeRemainingTokens(new BigNumber('1').valueOf());
        await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
            accounts[0],
            accounts[1],
            accounts[2],
        ])
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocations.testChangeRemainingTokens(new BigNumber('150000000').mul(precision).valueOf());

        await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
            accounts[0],
            0x0,
            accounts[2],
        ])
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
            accounts[1],
            accounts[2],
            accounts[3],
        ])
            .then(Utils.receiptShouldSucceed);
        await allocations.setTeamAllocation(new BigNumber('10000').mul(precision).valueOf(),[
            accounts[4],
            accounts[9],
        ])
            .then(Utils.receiptShouldSucceed);
        await allocations.setICO(ico.address)

        await Utils.checkState({allocations, token}, {
            allocations: {
                token: token.address,
                ico: ico.address,
                remainingTokens: new BigNumber('150000000').mul(precision).sub(new BigNumber('50000').mul(precision)).valueOf()
            },
            token: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[4]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[9]]: new BigNumber('0').mul(precision).valueOf()},
                ],
            }
        });

        await allocations.allocate({from: accounts[2]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await allocations.removeAdvisorsTier(1);
        await allocations.allocate()
            .then(Utils.receiptShouldSucceed);

        await allocations.sendMarketingBountyTokens()
            .then(Utils.receiptShouldSucceed);
        await allocations.sendMarketingBountyTokens()
            .then(Utils.receiptShouldSucceed);
        await allocations.sendEcosystemIncentiveTokens()
            .then(Utils.receiptShouldSucceed);
        await allocations.sendEcosystemIncentiveTokens()
            .then(Utils.receiptShouldSucceed);
        await allocations.sendLiquidityFundTokens()
            .then(Utils.receiptShouldSucceed);
        await allocations.sendLiquidityFundTokens()
            .then(Utils.receiptShouldSucceed);
        await allocations.sendTreasuryTokens()
            .then(Utils.receiptShouldSucceed);
        await allocations.sendTreasuryTokens()
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({allocations, token}, {
            allocations: {
                token: token.address,
                ico: ico.address,
                remainingTokens: new BigNumber('150000000').mul(precision).sub(new BigNumber('40000').mul(precision)).valueOf()
            },
            token: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('10000').mul(precision).valueOf()},
                    {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('10000').mul(precision).valueOf()},
                    {[accounts[4]]: new BigNumber('10000').mul(precision).valueOf()},
                    {[accounts[5]]: new BigNumber('200000000').mul(precision).valueOf()},
                    {[accounts[6]]: new BigNumber('50000000').mul(precision).valueOf()},
                    {[accounts[7]]: new BigNumber('50000000').mul(precision).valueOf()},
                    {[accounts[8]]: new BigNumber('200000000').mul(precision).valueOf()},
                    {[accounts[9]]: new BigNumber('10000').mul(precision).valueOf()},
                ],
            }
        });
        assert.equal(await allocations.teamBalances.call(accounts[1]), 0, "teamBalances is not equal");
        assert.equal(await allocations.advisorsBalances.call(accounts[1]),  new BigNumber('10000').mul(precision).valueOf(), "advisorsBalances is not equal");
        assert.equal(await allocations.teamBalances.call(accounts[4]), new BigNumber('10000').mul(precision).valueOf(), "teamBalances is not equal");
        assert.equal(await allocations.advisorsBalances.call(accounts[4]),  0, "advisorsBalances is not equal");
        await allocations.burnAdviserOrTeamMemberTokens(accounts[3])
        await Utils.checkState({allocations, token}, {
            allocations: {
                token: token.address,
                ico: ico.address,
                remainingTokens: new BigNumber('150000000').mul(precision).sub(new BigNumber('30000').mul(precision)).valueOf()
            },
            token: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('10000').mul(precision).valueOf()},
                    {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[6]]: new BigNumber('50000000').mul(precision).valueOf()},
                ],
            }
        });
    });


});
