var
    PrivateSale = artifacts.require("./test/TestPrivateSale.sol"),
    Gig = artifacts.require("./test/TestGig.sol"),
    ICO = artifacts.require("./test/TestICO.sol"),

    Utils = require("./utils"),
    BigNumber = require('bignumber.js'),

    precision = new BigNumber("1000000000000000000"),
    usdPrecision = new BigNumber("100000"),
    icoSince = parseInt(new Date().getTime() / 1000 - 3600),
    icoTill = parseInt(new Date().getTime() / 1000) + 3600,
    signAddress = web3.eth.accounts[0],
    wrongSigAddress = web3.eth.accounts[8],
    etherHolder = web3.eth.accounts[5];

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
    const token = await Gig.new(false);

    const privateico = await PrivateSale.new(
        token.address, //_token
        etherHolder, //_etherHolder
        icoSince, //_startTime
        icoTill,//_endTime
        new BigNumber('350000000').mul(precision).valueOf(),//_maxTokenSupply
        new BigNumber('119493000').valueOf(), //_etherPriceInUSD
    );
    await token.addMinter(privateico.address);
    await token.setPrivateSale(privateico.address);
    await privateico.setAllowedMultivest(signAddress);
    return {token, privateico};
}

contract('PrivateSale', function (accounts) {

    it("deploy & check constructor info & setTokenContract & changeSaleDates", async function () {
        const {token, privateico} = await deploy();

        await Utils.checkState({privateico, token}, {
            privateico: {
                price: new BigNumber('0.2480').mul(usdPrecision).valueOf(),
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('350000000').mul(precision).valueOf(),
                soldTokens: 0,
                collectedEthers: 0,
                etherHolder: etherHolder,
                collectedUSD: 0,
                etherPriceInUSD: new BigNumber('1194.93').mul(usdPrecision).valueOf(),
                etherBalances: [
                    {[accounts[0]]: 0},
                    {[accounts[1]]: 0},
                ],
                allowedMultivests: [
                    {[signAddress]: true},
                    {[accounts[1]]: false},
                ]
            }
        });

        await privateico.setTokenContract(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await privateico.setTokenContract(accounts[2])
            .then(Utils.receiptShouldSucceed);

        assert.equal(await privateico.withinPeriod.call(), true, 'withinPeriod is not equal');
        assert.equal(await privateico.isActive.call(), true, 'withinPeriod is not equal');

        await privateico.testChangeSoldTokens(new BigNumber('350000000').mul(precision).valueOf());

        assert.equal(await privateico.isActive.call(), false, 'withinPeriod is not equal');

        await privateico.changeSalePeriod(icoTill, icoTill + 3600, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await privateico.changeSalePeriod(icoTill, icoTill + 3600);

        assert.equal(await privateico.withinPeriod.call(), false, 'withinPeriod is not equal');

    });

    it("check buy & check moveUnsoldTokens", async function () {
        const {token, privateico} = await deploy();

        await Utils.checkState({privateico, token}, {
            token: {
                balanceOf: [
                    {[accounts[0]]: 0},
                ],
            },
            privateico: {
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('350000000').mul(precision).valueOf(),
                soldTokens: 0,
                collectedEthers: 0,
                etherHolder: etherHolder,
                collectedUSD: 0,
                price: new BigNumber('0.2480').mul(usdPrecision).valueOf(),
                etherBalances: [
                    {[accounts[0]]: 0},
                    {[accounts[1]]: 0},
                ],
                etherPriceInUSD: new BigNumber('1194.93').mul(usdPrecision).valueOf(),
                allowedMultivests: [
                    {[signAddress]: true},
                    {[accounts[1]]: false},
                ],
            }
        });

        await makeTransactionKYC(privateico, wrongSigAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        //10 ^ 18 * 119493000 / 24800 * 175/100 = 8431965725806451612903
        await makeTransactionKYC(privateico, signAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldSucceed);
        await makeTransactionKYC(privateico, signAddress, accounts[0], new BigNumber('0').mul(precision).valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await makeTransactionKYC(privateico, signAddress, accounts[0], new BigNumber('100').valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await Utils.checkState({privateico, token}, {
            token: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('8431965725806451612903').valueOf()},
                ],
            },
            privateico: {
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('350000000').mul(precision).valueOf(),
                soldTokens: new BigNumber('8431965725806451612903').valueOf(),
                collectedEthers: new BigNumber('1').mul(precision).valueOf(),
                etherHolder: etherHolder,
                collectedUSD: new BigNumber('1194.93').mul(usdPrecision).valueOf(),
                price: new BigNumber('0.2480').mul(usdPrecision).valueOf(),
                etherBalances: [
                    {[accounts[0]]: new BigNumber('1').mul(precision).valueOf()},
                    {[accounts[1]]: 0},
                ],
                etherPriceInUSD: new BigNumber('1194.93').mul(usdPrecision).valueOf(),
                allowedMultivests: [
                    {[signAddress]: true},
                    {[accounts[1]]: false},
                ]
            }
        });
        const ico = await ICO.new(
            token.address, //_token
            etherHolder, //_etherHolder
            new BigNumber('350000000').mul(precision).valueOf(),//_maxTokenSupply
            24800,
            icoTill+50, //_startTime
            icoTill+100,//_endTime
            150000000
        );
        await privateico.setICO(ico.address);
        await privateico.moveUnsoldTokens({from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        //
        await privateico.moveUnsoldTokens();
        await ico.setPrivateSale(privateico.address);
        // assert.equal(await ico.isTransferAllowed.call(accounts[0],  new BigNumber('8431965725806451612903').valueOf()), true, "isTransferAllowed is not equal");
        await privateico.changeSalePeriod(icoSince - 3600 * 5, icoSince - 3600);
        assert.equal(await privateico.withinPeriod.call(), false, 'withinPeriod is not equal');
        assert.equal(await privateico.isActive.call(), false, 'isActive is not equal');
        await privateico.moveUnsoldTokens();
        await Utils.checkState({privateico, token, ico}, {
            token: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('8431965725806451612903').valueOf()},
                ],
            },
            privateico: {
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime: icoSince - 3600 * 5,
                endTime: icoSince - 3600,
                maxTokenSupply: new BigNumber('8431965725806451612903').valueOf(),
                soldTokens: new BigNumber('8431965725806451612903').valueOf(),
                collectedEthers: new BigNumber('1').mul(precision).valueOf(),
                etherHolder: etherHolder,
                collectedUSD: new BigNumber('1194.93').mul(usdPrecision).valueOf(),
                price: new BigNumber('0.2480').mul(usdPrecision).valueOf(),
                etherBalances: [
                    {[accounts[0]]: new BigNumber('1').mul(precision).valueOf()},
                    {[accounts[1]]: 0},
                ],
                etherPriceInUSD: new BigNumber('1194.93').mul(usdPrecision).valueOf(),
                allowedMultivests: [
                    {[signAddress]: true},
                    {[accounts[1]]: false},
                ]
            },
            ico: {
                maxTokenSupply: new BigNumber('350000000').mul(precision).sub('8431965725806451612903').valueOf(),
            }

        });
        await privateico.setEtherInUSD('194.93000');
        assert.equal(await privateico.isTransferAllowed.call(accounts[0], 0), true, 'isTransferAllowed is not equal');
        await Utils.checkState({privateico, token, ico}, {
            token: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('8431965725806451612903').valueOf()},
                ],
            },
            privateico: {
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime: icoSince - 3600 * 5,
                endTime: icoSince - 3600,
                maxTokenSupply: new BigNumber('8431965725806451612903').valueOf(),
                soldTokens: new BigNumber('8431965725806451612903').valueOf(),
                collectedEthers: new BigNumber('1').mul(precision).valueOf(),
                etherHolder: etherHolder,
                collectedUSD: new BigNumber('1194.93').mul(usdPrecision).valueOf(),
                price: new BigNumber('0.2480').mul(usdPrecision).valueOf(),
                etherBalances: [
                    {[accounts[0]]: new BigNumber('1').mul(precision).valueOf()},
                    {[accounts[1]]: 0},
                ],
                etherPriceInUSD: new BigNumber('194.93').mul(usdPrecision).valueOf(),
                allowedMultivests: [
                    {[signAddress]: true},
                    {[accounts[1]]: false},
                ]
            },
            ico: {
                maxTokenSupply: new BigNumber('350000000').mul(precision).sub('8431965725806451612903').valueOf(),
            }

        });
    });

    it("deploy & check MultivestBuy", async function () {
        const {token, privateico} = await deploy();

        await Utils.checkState({privateico, token}, {
            privateico: {
                price: new BigNumber('0.2480').mul(usdPrecision).valueOf(),
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('350000000').mul(precision).valueOf(),
                soldTokens: 0,
                collectedEthers: 0,
                etherHolder: etherHolder,
                collectedUSD: 0,
                etherPriceInUSD: new BigNumber('1194.93').mul(usdPrecision).valueOf(),
                etherBalances: [
                    {[accounts[0]]: 0},
                    {[accounts[1]]: 0},
                ],
                allowedMultivests: [
                    {[signAddress]: true},
                    {[accounts[1]]: false},
                ]
            }
        });



        assert.equal(await privateico.withinPeriod.call(), true, 'withinPeriod is not equal');
        assert.equal(await privateico.isActive.call(), true, 'withinPeriod is not equal');
        await  privateico.multivestBuy(accounts[0], new BigNumber('1').mul(precision).valueOf(),{from: signAddress})
            .then(Utils.receiptShouldSucceed);
        await  privateico.setAllowedMultivest(accounts[8])
        await  privateico.multivestBuy(accounts[0], new BigNumber('1').mul(precision).valueOf(),{from: accounts[8]})
            .then(Utils.receiptShouldSucceed);
        await  privateico.multivestBuy(accounts[0], new BigNumber('1').mul(precision).valueOf(),{from: wrongSigAddress})
            .then(Utils.receiptShouldFailed)
        .catch(Utils.catchReceiptShouldFailed);


    });

});
