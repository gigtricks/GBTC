var
    PrivateSale = artifacts.require("./PrivateSale.sol"),
    ICO = artifacts.require("./CrowdSale.sol"),
    TestGig = artifacts.require("./test/TestGig.sol"),
    GigAllocation = artifacts.require("./GigAllocation.sol"),

    Utils = require("./utils"),
    BigNumber = require('bignumber.js'),

    precision = new BigNumber("1000000000000000000"),
    icoSince = parseInt(new Date().getTime() / 1000 - 3600),
    icoTill = parseInt(new Date().getTime() / 1000) + 3600,
    signAddress = web3.eth.accounts[0],
    etherHolder = web3.eth.accounts[5],
    wrongSigAddress = web3.eth.accounts[7]

// function makeTransaction(instance, value, add, from) {
//     "use strict";
//     return instance.multivestBuy(add, value, {from: from});
// }

async function deploy() {
    const token = await TestGig.new( false);
    const ico = await ICO.new(
        token.address, //_token
        etherHolder, //_etherHolder
        new BigNumber('350000000').mul(precision).valueOf(),//_maxTokenSupply
        24800,
        icoSince, //_startTime
        icoTill,//_endTime
        150000000
    );
    const allocations = await GigAllocation.new(token.address, ico.address, new BigNumber('150000000000000000000000000'),
        web3.eth.accounts[5],web3.eth.accounts[6],web3.eth.accounts[7],web3.eth.accounts[8]);

    await token.addMinter(ico.address);
    await token.setICO(ico.address);
    await ico.setAllowedMultivest(signAddress);

    return {token, token, token, ico, allocations};
}

contract('Token', function (accounts) {

    it("deploy & check constructor info & check: setICO, SetLocked with transfers", async function () {
        const {token, privateico, preico, ico, allocations} = await deploy();

        await Utils.checkState({token}, {
            token: {
                ico: ico.address,
                transferFrozen: true,
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
        //setICO
        await token.setICO(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setICO(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setICO(accounts[2])
            .then(Utils.receiptShouldSucceed);
        await token.setAllocationContract(allocations.address)
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
        await token.setICO(ico.address)
            .then(Utils.receiptShouldSucceed);


        await token.transfer(accounts[1], 500)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.approve(accounts[1], 500);
        assert.equal(await token.transferFrom.call(accounts[0], accounts[1], 500, {from: accounts[1]}).valueOf(), false, 'transferFrom is not equal');

        await token.setLocked(false)
            .then(Utils.receiptShouldSucceed);
        assert.equal(await token.locked.call(), false, 'locked is not equal');
        await token.setICO(ico.address)
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({token}, {
            token: {
                ico: ico.address,
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
        const {token, privateico, preico, ico, allocations} = await deploy();

        await token.addMinter(accounts[3]);
        await token.setICO(ico.address)
            .then(Utils.receiptShouldSucceed);
        await token.mint(accounts[0], 1000, {from: accounts[3]})
            .then(() => Utils.balanceShouldEqualTo(token, accounts[0], 1000));

        await Utils.checkState({token}, {
            token: {
                ico: ico.address,
                transferFrozen: true,
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
});