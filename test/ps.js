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
    privateSaleSince = parseInt(new Date().getTime() / 1000 - 3600),
    privateSaleTill = parseInt(new Date().getTime() / 1000) + 3600,
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

    const privateSale = await PrivateSale.new(
        token.address, //_token,
        etherHolder,// _etherHolder,
        privateSaleSince, //_startTime
        privateSaleTill,//_endTime
        new BigNumber('14000000000000000000000000').valueOf(),
        new BigNumber('1194.93').mul(usdPrecision).valueOf()
    )
    await token.addMinter(privateSale.address);
    await token.setPrivateSale(privateSale.address);
    await privateSale.setAllowedMultivest(signAddress);
    return {token, privateSale};
}

contract('PrivateSale', function (accounts) {

    it("deploy & check constructor info & setTokenContract & changeSaleDates", async function () {
        const {token, privateSale} = await deploy();

        await Utils.checkState({privateSale, token}, {
            privateSale: {
                price: new BigNumber('0.2480').mul(usdPrecision).valueOf(),
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('14000000').mul(precision).valueOf(),
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

        await privateSale.setTokenContract(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await privateSale.setTokenContract(accounts[2])
            .then(Utils.receiptShouldSucceed);

        assert.equal(await privateSale.withinPeriod.call(), true, 'withinPeriod is not equal');
        assert.equal(await privateSale.isActive.call(), true, 'withinPeriod is not equal');

        await privateSale.testChangeSoldTokens(new BigNumber('14000000').mul(precision).valueOf());

        assert.equal(await privateSale.isActive.call(), false, 'withinPeriod is not equal');

        await privateSale.changeSalePeriod(icoTill, icoTill + 3600, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await privateSale.changeSalePeriod(icoTill, icoTill + 3600);

        assert.equal(await privateSale.withinPeriod.call(), false, 'withinPeriod is not equal');

    });

    it("check buy & check moveUnsoldTokens", async function () {
        const {token, privateSale} = await deploy();

        await Utils.checkState({privateSale, token}, {
            token: {
                balanceOf: [
                    {[accounts[0]]: 0},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                ],
            },
            privateSale: {
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime:privateSaleSince, //_startTime
                endTime:privateSaleTill,//_endTime
                maxTokenSupply: new BigNumber('14000000').mul(precision).valueOf(),
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

        await makeTransactionKYC(privateSale, wrongSigAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        //((10 ^ 18) * (1194.93 * 10 ^ 5) / (0.2480 * 10 ^ 5*(100-75)/100)) = 19273064516129032258064
        await makeTransactionKYC(privateSale, signAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldSucceed);
        await makeTransactionKYC(privateSale, signAddress, accounts[0], new BigNumber('0').mul(precision).valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await makeTransactionKYC(privateSale, signAddress, accounts[0], new BigNumber('100').valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await Utils.checkState({privateSale, token}, {
            token: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('19273064516129032258064').valueOf()},
                ],
            },
            privateSale: {
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('14000000').mul(precision).valueOf(),
                soldTokens: new BigNumber('19273064516129032258064').valueOf(),
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
            new BigNumber('248500000000000000000000000').valueOf(),//_maxTokenSupply
            new BigNumber('87500000000000000000000000').valueOf(),//_maxTokenSupply
            24800,
            icoSince, //_startTime
            icoTill,//_endTime
            150000000,
        );
        await Utils.checkState({privateSale, token, ico}, {
            token: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('19273064516129032258064').valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('19273064516129032258064').valueOf()},
                ],
            },
            privateSale: {
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime:privateSaleSince, //_startTime
                endTime:privateSaleTill,//_endTime
                maxTokenSupply: new BigNumber('14000000000000000000000000').valueOf(),
                soldTokens: new BigNumber('19273064516129032258064').valueOf(),
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
                maxTokenSupply: new BigNumber('336000000000000000000000000').valueOf(),
            }

        });
        await privateSale.setCrowdSale(ico.address);
        await token.setCrowdSale(ico.address);
        await privateSale.moveUnsoldTokens({from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await privateSale.moveUnsoldTokens()
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await ico.setPrivateSale(privateSale.address);
        assert.equal(await ico.isTransferAllowed.call(accounts[0],  new BigNumber('19273064516129032258064').valueOf()), false, "isTransferAllowed is not equal");
        await privateSale.changeSalePeriod(icoSince - 3600 * 5, icoSince - 3600);
        assert.equal(await privateSale.withinPeriod.call(), false, 'withinPeriod is not equal');
        assert.equal(await privateSale.isActive.call(), false, 'isActive is not equal');
        await privateSale.moveUnsoldTokens();
        await Utils.checkState({privateSale, token, ico}, {
            token: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('19273064516129032258064').valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('19273064516129032258064').valueOf()},
                ],
            },
            privateSale: {
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime:icoSince - 3600 * 5, //_startTime
                endTime: icoSince - 3600,//_endTime
                maxTokenSupply: new BigNumber('19273064516129032258064').valueOf(),
                soldTokens: new BigNumber('19273064516129032258064').valueOf(),
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
                maxTokenSupply: (new BigNumber(336000000).mul(precision)).add(new BigNumber('14000000').mul(precision).sub('19273064516129032258064')).valueOf(),
            }

        });
        await privateSale.setEtherInUSD('194.93000');
        assert.equal(await privateSale.isTransferAllowed.call(accounts[0], 0), false, 'isTransferAllowed is not equal');
        await Utils.checkState({privateSale, token, ico}, {
            token: {
                balanceOf: [
                    {[accounts[0]]: new BigNumber('19273064516129032258064').valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('19273064516129032258064').valueOf()},
                ],
            },
            privateSale: {
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime: icoSince - 3600 * 5,
                endTime: icoSince - 3600,
                maxTokenSupply: new BigNumber('19273064516129032258064').valueOf(),
                soldTokens: new BigNumber('19273064516129032258064').valueOf(),
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
        });
    });

    it("deploy & check MultivestBuy", async function () {
        const {token, privateSale} = await deploy();

        await Utils.checkState({privateSale, token}, {
            privateSale: {
                price: new BigNumber('0.2480').mul(usdPrecision).valueOf(),
                token: token.address,
                minPurchase: new BigNumber('100').mul(usdPrecision).valueOf(),
                maxPurchase: new BigNumber('0').mul(precision).valueOf(),
                softCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('0').mul(usdPrecision).valueOf(),
                startTime: icoSince,
                endTime: icoTill,
                maxTokenSupply: new BigNumber('14000000').mul(precision).valueOf(),
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



        assert.equal(await privateSale.withinPeriod.call(), true, 'withinPeriod is not equal');
        assert.equal(await privateSale.isActive.call(), true, 'withinPeriod is not equal');
        await  privateSale.multivestBuy(accounts[0], new BigNumber('1').mul(precision).valueOf(),{from: signAddress})
            .then(Utils.receiptShouldSucceed);
        await  privateSale.setAllowedMultivest(accounts[6])
        await  privateSale.multivestBuy(accounts[0], new BigNumber('1').mul(precision).valueOf(),{from: accounts[6]})
            .then(Utils.receiptShouldSucceed);
        await  privateSale.multivestBuy(accounts[0], new BigNumber('1').mul(precision).valueOf(),{from: wrongSigAddress})
            .then(Utils.receiptShouldFailed)
        .catch(Utils.catchReceiptShouldFailed);


    });
    it("deploy & check Tokens and Ethers calculation", async function (){
        const {token, privateSale} = await deploy();
        let zal = await privateSale.calculateTokensAmount.call(100);
        assert.equal(zal[0], 0, 'calculateTokensAmount is not equal');
        assert.equal(zal[1], 0, 'calculateTokensAmount is not equal');
        //((10 ^ 18) * (1194.93 * 10 ^ 5) / (0.2480 * 10 ^ 5*(100-75)/100))

        zal = await privateSale.calculateTokensAmount.call(new BigNumber(web3.toWei('1', 'ether')));
        assert.equal(zal[0], new BigNumber('19273064516129032258064').valueOf(), 'TokensAmount is not equal');

        assert.equal(new BigNumber(zal[1]).valueOf(), 119493000, 'USDAmount is not equal');
//((83686910530323990) * (1194.93 * 10 ^ 5) / (0.2480 * 10 ^ 5*(100-75)/100))
        zal = await privateSale.calculateTokensAmount.call(new BigNumber('83686910530323990'));
        assert.equal(zal[0], new BigNumber('1612903225806452344688').valueOf(), 'TokensAmount is not equal');
        assert.equal(new BigNumber(zal[1]).valueOf(), 10000000, 'USDAmount is not equal');
        zal = await privateSale.calculateEthersAmount.call(0)
        assert.equal(zal[0], 0, 'calculateEthersAmount is not equal');
        console.log('min', await privateSale.getMinEthersInvestment.call());
        // 83686910530323952
        zal = await privateSale.calculateEthersAmount.call(new BigNumber('1').mul(precision))
        assert.equal(new BigNumber(zal[0]).valueOf(), 0, 'calculateEthersAmount is not equal');

        zal = await privateSale.calculateEthersAmount.call(new BigNumber('19273064516129032258064'));
        assert.equal(new BigNumber(zal[0]).valueOf(), new BigNumber('999999999999999999').valueOf(), 'ethers is not equal');

    });
});

