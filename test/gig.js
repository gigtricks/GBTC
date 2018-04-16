var
    PrivateSale = artifacts.require("./PrivateSale.sol"),
    ICO = artifacts.require("./TestICO.sol"),
    TestGig = artifacts.require("./test/TestGig.sol"),
    GigAllocation = artifacts.require("./TokenAllocation.sol"),

    Utils = require("./utils"),
    BigNumber = require('bignumber.js'),

    precision = new BigNumber("1000000000000000000"),
    privateSaleSince = parseInt(new Date().getTime() / 1000 - 3600),
    privateSaleTill = parseInt(new Date().getTime() / 1000) + 3600,
    icoSince = parseInt(new Date().getTime() / 1000 + 4600),
    icoTill = parseInt(new Date().getTime() / 1000) + 8*3600,
    signAddress = web3.eth.accounts[0],
    etherHolder = web3.eth.accounts[5],
    wrongSigAddress = web3.eth.accounts[7]

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
    const token = await TestGig.new(false);
    const privateSale = await PrivateSale.new(
        token.address, //_token,
        etherHolder,// _etherHolder,
        privateSaleSince, //_startTime
        privateSaleTill,//_endTime
        new BigNumber('14000000000000000000000000').valueOf(),
        150000000
    )
    await token.addMinter(privateSale.address);
    await token.setPrivateSale(privateSale.address);
    await privateSale.setAllowedMultivest(signAddress);

    return {token, privateSale};
}

contract('PrivateSale', function (accounts) {

    it("deploy & check constructor info & check: setPrivateSale, SetLocked with transfers", async function () {
        const {token, privateSale} = await deploy();

        await Utils.checkState({token,privateSale}, {
            token: {
                privateSale: privateSale.address,
                transferFrozen: false,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                // disableMinting: false,
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('0').mul(precision).valueOf(),
                owner: accounts[0]
            }
        });
        //setPrivateSale
        await token.setPrivateSale(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setPrivateSale(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setPrivateSale(accounts[2])
            .then(Utils.receiptShouldSucceed);

        //SetLocked with transfers
        await token.setLocked(true, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        assert.equal(await token.locked.call(), false, 'locked is not equal')
        await token.addMinter(accounts[3]);
        await token.mint(accounts[0], 1000, {from: accounts[3]})
            .then(() => Utils.balanceShouldEqualTo(token, accounts[0], 1000));
        await token.setLocked(true)
            .then(Utils.receiptShouldSucceed);
        assert.equal(await token.locked.call(), true, 'locked is not equal')

        await token.testSetFreezing(false);
        await token.setPrivateSale(privateSale.address)
            .then(Utils.receiptShouldSucceed);


        await token.transfer(accounts[1], 500)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.approve(accounts[1], 500);
        assert.equal(await token.transferFrom.call(accounts[0], accounts[1], 500, {from: accounts[1]}).valueOf(), false, 'transferFrom is not equal');

        await token.setLocked(false)
            .then(Utils.receiptShouldSucceed);
        assert.equal(await token.locked.call(), false, 'locked is not equal');
        await token.setPrivateSale(privateSale.address)
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: 1000},
                ],
                totalSupply: new BigNumber('1000').valueOf(),
                owner: accounts[0]
            }
        });

    });

    it("deploy & freezing & transfer & approve & transferFrom", async function () {
        const {token, privateSale} = await deploy();

        await token.addMinter(accounts[3]);
        await token.setPrivateSale(privateSale.address)
            .then(Utils.receiptShouldSucceed);
        await token.mint(accounts[0], 1000, {from: accounts[3]})
            .then(() => Utils.balanceShouldEqualTo(token, accounts[0], 1000));

        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                transferFrozen: false,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('1000').valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('1000').valueOf(),
                owner: accounts[0]
            }
        });

        await token.freezing(false, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);


    });
    it("check that setPrivateSale updates privateSale, and not affects crowdSaleEndTime", async function(){
        const {token, privateSale} = await deploy();
        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                crowdSaleEndTime: 0,
                transferFrozen: false,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('0').valueOf(),
                owner: accounts[0]
            }
        });
    })

    it("check that setCrowdSale updates crowdSale, and changes crowdSaleEndTime", async function(){
        const {token, privateSale} = await deploy();


        const ico = await ICO.new(
            token.address, //_token
            etherHolder, //_etherHolder
            new BigNumber('248500000000000000000000000').valueOf(),//_maxTokenSupply
            new BigNumber('248500000000000000000000000').valueOf(),//_maxTokenSupply
            24800,
            icoSince, //_startTime
            icoTill,//_endTime
            150000000,
        );
        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                crowdSale: "0x0000000000000000000000000000000000000000",
                crowdSaleEndTime: 0,
                transferFrozen: false,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('0').valueOf(),
                owner: accounts[0]
            }
        });
        await token.setCrowdSale(ico.address);
        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                crowdSale: ico.address,
                crowdSaleEndTime: icoTill,
                transferFrozen: false,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('0').valueOf(),
                owner: accounts[0]
            }
        });
    })
    it("check that trasnferFrom, approve, increaseApproval, decreaseApproval are forbidden to call before end of ICO", async function(){
        const {token, privateSale} = await deploy();


        let ico = await ICO.new(
            token.address, //_token
            etherHolder, //_etherHolder
            new BigNumber('248500000000000000000000000').valueOf(),//_maxTokenSupply
            new BigNumber('248500000000000000000000000').valueOf(),//_maxTokenSupply
            24800,
            icoSince, //_startTime
            icoTill,//_endTime
            150000000,
        );
        await token.setCrowdSale(ico.address);
        await token.mint(accounts[3], 1000, {from: accounts[0]})
            .then(() => Utils.balanceShouldEqualTo(token, accounts[3], 1000));

        await token.approve(accounts[2], 100, {from :accounts[3]})
    .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        await token.increaseApproval(accounts[2], 100, {from :accounts[3]})
    .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        await token.decreaseApproval(accounts[2], 100,  {from :accounts[3]})
    .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        await token.transferFrom(accounts[3],accounts[2], 100,  {from :accounts[2]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)
        ico = await ICO.new(
            token.address, //_token
            etherHolder, //_etherHolder
            new BigNumber('248500000000000000000000000').valueOf(),//_maxTokenSupply
            new BigNumber('248500000000000000000000000').valueOf(),//_maxTokenSupply
            24800,
            parseInt(new Date().getTime() / 1000 - (31556926 +2592000*2)),
            parseInt(new Date().getTime() / 1000 - (31556926 + 2592000)),
            150000000,
        );
        await token.setCrowdSale(ico.address);

        await token.approve(accounts[2], 100, {from :accounts[3]})
            .then(Utils.receiptShouldSucceed)
        await token.increaseApproval(accounts[2], 100, {from :accounts[3]})
            .then(Utils.receiptShouldSucceed)
        await token.decreaseApproval(accounts[2], 100,  {from :accounts[3]})
            .then(Utils.receiptShouldSucceed)
        await token.transferFrom(accounts[3],accounts[1], 100,  {from :accounts[2]})
            .then(Utils.receiptShouldSucceed)

        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                transferFrozen: false,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[3]]: new BigNumber('900').valueOf()},
                    {[accounts[1]]: new BigNumber('100').valueOf()},
                ],
                totalSupply: new BigNumber('1000').valueOf(),
                owner: accounts[0]
            }
        });
    })

    it("check that burn is not allowed to call before end of CrowdSale", async function() {
        const {token, privateSale} = await deploy();
        await Utils.checkState({token,privateSale}, {
            token: {
                privateSale: privateSale.address,
                transferFrozen: false,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                // disableMinting: false,
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('0').mul(precision).valueOf(),
                owner: accounts[0]
            }
        });

        await Utils.checkState({token,privateSale}, {
            token: {
                privateSale: privateSale.address,
                transferFrozen: false,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                // disableMinting: false,
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('0').mul(precision).valueOf(),
                owner: accounts[0]
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
        await ico.burnUnsoldTokens()
            // .then(Utils.receiptShouldFailed)
            // .catch(Utils.catchReceiptShouldFailed)

        await Utils.checkState({token,privateSale}, {
            token: {
                privateSale: privateSale.address,
                transferFrozen: false,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                // disableMinting: false,
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('0').mul(precision).valueOf(),
                owner: accounts[0]
            }
        });
        await ico.testChangeICOPeriod(parseInt(new Date().getTime() / 1000 - 3600),parseInt(new Date().getTime() / 1000 - 600))
        await token.setCrowdSale(ico.address)
        await ico.burnUnsoldTokens()

        await Utils.checkState({token,privateSale}, {
            token: {
                privateSale: privateSale.address,
                transferFrozen: false,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('664000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                // disableMinting: false,
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('0').mul(precision).valueOf(),
                owner: accounts[0]
            }
        });
    })
    it("check that increaseLockedBalance only increases investor locked amount", async function() {
        const {token, privateSale} = await deploy();
        await privateSale.setEtherInUSD('1194.93000');
        let calcualtion = await privateSale.calculateTokensAmount(new BigNumber('1').mul(precision).valueOf());
        console.log(calcualtion[0]);
        console.log(calcualtion[1]);
        //((10 ^ 18) * (1194.93 * 10 ^ 5)) / ((0.2480 * 10 ^ 5)*(100-75)/100) = 19273064516129032258064
        await makeTransactionKYC(privateSale, signAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldSucceed)

        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('19273064516129032258064').valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('19273064516129032258064').valueOf()},
                ],
                totalSupply: new BigNumber('19273064516129032258064').valueOf(),
                owner: accounts[0]
            }
        });
    })
    it("check that isTransferAllowed failed if transferFrozen", async function() {
        const {token, privateSale} = await deploy();
        token.mint(accounts[0], new BigNumber('1').mul(precision).valueOf());
        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('1').mul(precision).valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: 0},
                ],
                totalSupply: new BigNumber('1').mul(precision).valueOf(),
                owner: accounts[0]
            }
        });
        assert.equal(await token.isTransferAllowed.call(accounts[0], new BigNumber('0.1').mul(precision).valueOf()), true, 'isTransferAllowed is not equal');
        token.freezing(true);
        assert.equal(await token.isTransferAllowed.call(accounts[0], new BigNumber('0.1').mul(precision).valueOf()), false, 'isTransferAllowed is not equal');

    })

    it("check that isTransferAllowed failed if user has not enough unlocked balance", async function() {
        const {token, privateSale} = await deploy();
        token.mint(accounts[0], new BigNumber('1').mul(precision).valueOf());
        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('1').mul(precision).valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: 0},
                ],
                totalSupply: new BigNumber('1').mul(precision).valueOf(),
                owner: accounts[0]
            }
        });
        //((10 ^ 18) * (1500 * 10 ^ 5)) / ((0.2480 * 10 ^ 5)*(100-75)/100) = 24193548387096774193548
        await makeTransactionKYC(privateSale, signAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldSucceed)

        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('24194548387096774193548').valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('24193548387096774193548').valueOf()},
                ],
                totalSupply: new BigNumber('24194548387096774193548').valueOf(),
                owner: accounts[0]
            }
        });
        assert.equal(await token.isTransferAllowed.call(accounts[0], new BigNumber('1').mul(precision).valueOf()), true, 'isTransferAllowed is not equal');
        assert.equal(await token.isTransferAllowed.call(accounts[0], new BigNumber('1.1').mul(precision).valueOf()), false, 'isTransferAllowed is not equal');
    })
    it("check that isTransferAllowed failed if user has not enough unlocked balance, after transfering enough tokens balance", async function() {
        const {token, privateSale} = await deploy();
        token.mint(accounts[0], new BigNumber('1').mul(precision).valueOf());
        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('1').mul(precision).valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: 0},
                ],
                totalSupply: new BigNumber('1').mul(precision).valueOf(),
                owner: accounts[0]
            }
        });
        //((10 ^ 18) * (1500 * 10 ^ 5)) / ((0.2480 * 10 ^ 5)*(100-75)/100) = 24193548387096774193548
        await makeTransactionKYC(privateSale, signAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldSucceed)

        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('24194548387096774193548').valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('24193548387096774193548').valueOf()},
                ],
                totalSupply: new BigNumber('24194548387096774193548').valueOf(),
                owner: accounts[0]
            }
        });
        assert.equal(await token.isTransferAllowed.call(accounts[0], new BigNumber('1').mul(precision).valueOf()), true, 'isTransferAllowed is not equal');
        token.transfer(accounts[1], new BigNumber('0.5').mul(precision).valueOf())
        assert.equal(await token.isTransferAllowed.call(accounts[0], new BigNumber('0.6').mul(precision).valueOf()), false, 'isTransferAllowed is not equal');
        token.transfer(accounts[1], new BigNumber('0.6').mul(precision).valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: new BigNumber('500000000000000000').valueOf()},
                    {[accounts[0]]: new BigNumber('24194048387096774193548').valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('24193548387096774193548').valueOf()},
                ],
                totalSupply: new BigNumber('24194548387096774193548').valueOf(),
                owner: accounts[0]
            }
        });
    })

    it("check that isTransferAllowed succeed if user has enough unlocked balance", async function() {
        const {token, privateSale} = await deploy();
        token.mint(accounts[0], new BigNumber('1').mul(precision).valueOf());
        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('1').mul(precision).valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: 0},
                ],
                totalSupply: new BigNumber('1').mul(precision).valueOf(),
                owner: accounts[0]
            }
        });
        //((10 ^ 18) * (1500 * 10 ^ 5)) / ((0.2480 * 10 ^ 5)*(100-75)/100) = 24193548387096774193548
        await makeTransactionKYC(privateSale, signAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldSucceed)

        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('24194548387096774193548').valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('24193548387096774193548').valueOf()},
                ],
                totalSupply: new BigNumber('24194548387096774193548').valueOf(),
                owner: accounts[0]
            }
        });
        assert.equal(await token.isTransferAllowed.call(accounts[0], new BigNumber('1.1').mul(precision).valueOf()), false, 'isTransferAllowed is not equal');
        const ico = await ICO.new(
            token.address, //_token
            etherHolder, //_etherHolder
            new BigNumber('248500000000000000000000000').valueOf(),//_maxTokenSupply
            new BigNumber('248500000000000000000000000').valueOf(),//_maxTokenSupply
            24800,
            parseInt(new Date().getTime() / 1000 - (31556926 +2592000*2)),
            parseInt(new Date().getTime() / 1000 - (31556926 + 2592000)),
            150000000,
        );
        assert.equal(await token.isTransferAllowed.call(accounts[0], new BigNumber('2017129032258064516129').valueOf()), false, 'isTransferAllowed is not equal');
        await token.setCrowdSale(ico.address);
        assert.equal(await token.isTransferAllowed.call(accounts[0], new BigNumber('2017129032258064516129').valueOf()), true, 'isTransferAllowed is not equal');
        token.transfer(accounts[1], new BigNumber('2017129032258064516129').valueOf())
            .then(Utils.receiptShouldSucceed);
        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: new BigNumber('2017129032258064516129').valueOf()},
                    {[accounts[0]]: new BigNumber('22177419354838709677419').valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('24193548387096774193548').valueOf()},
                ],
                totalSupply: new BigNumber('24194548387096774193548').valueOf(),
                owner: accounts[0]
            }
        });
    })
    it("check that isTransferAllowed succeed if user has enough unlocked balance, after transfering enough tokens balance", async function() {
        const {token, privateSale} = await deploy();
        token.mint(accounts[0], new BigNumber('1').mul(precision).valueOf());
        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('1').mul(precision).valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: 0},
                ],
                totalSupply: new BigNumber('1').mul(precision).valueOf(),
                owner: accounts[0]
            }
        });
        //((10 ^ 18) * (1500 * 10 ^ 5)) / ((0.2480 * 10 ^ 5)*(100-75)/100) = 24193548387096774193548
        await makeTransactionKYC(privateSale, signAddress, accounts[0], new BigNumber('1').mul(precision).valueOf())
            .then(Utils.receiptShouldSucceed)

        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('24194548387096774193548').valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('24193548387096774193548').valueOf()},
                ],
                totalSupply: new BigNumber('24194548387096774193548').valueOf(),
                owner: accounts[0]
            }
        });
        token.transfer(accounts[1], new BigNumber('1').mul(precision).valueOf())
        const ico = await ICO.new(
            token.address, //_token
            etherHolder, //_etherHolder
            new BigNumber('248500000000000000000000000').valueOf(),//_maxTokenSupply
            new BigNumber('248500000000000000000000000').valueOf(),//_maxTokenSupply
            24800,
            parseInt(new Date().getTime() / 1000 - (31556926 +2592000*2)),
            parseInt(new Date().getTime() / 1000 - (31556926 + 2592000)),
            150000000,
        );
        assert.equal(await token.isTransferAllowed.call(accounts[0], new BigNumber('1008064516129032258064').valueOf()), false, 'isTransferAllowed is not equal');
        await token.setCrowdSale(ico.address);
        assert.equal(await token.isTransferAllowed.call(accounts[0], new BigNumber('1008064516129032258064').valueOf()), true, 'isTransferAllowed is not equal');
        token.transfer(accounts[1], new BigNumber('1008064516129032258064').valueOf())
            .then(Utils.receiptShouldSucceed);
        token.transfer(accounts[1], new BigNumber('1008064516129032258065').valueOf())
            .then(Utils.receiptShouldSucceed);
        await Utils.checkState({token}, {
            token: {
                privateSale: privateSale.address,
                standard: 'GBTC 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: false},
                ],
                decimals: 18,
                name: 'GigBit',
                symbol: 'GBTC',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: new BigNumber('2017129032258064516129').valueOf()},
                    {[accounts[0]]: new BigNumber('22177419354838709677419').valueOf()},
                ],
                lockedBalancesReleasedAfterOneYear: [
                    {[accounts[1]]: 0},
                    {[accounts[0]]: new BigNumber('24193548387096774193548').valueOf()},
                ],
                totalSupply: new BigNumber('24194548387096774193548').valueOf(),
                owner: accounts[0]
            }
        });
    })
});