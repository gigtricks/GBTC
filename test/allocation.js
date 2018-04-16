var
    PrivateSale = artifacts.require("./PrivateSale.sol"),
    TestGig = artifacts.require("./test/TestGig.sol"),
    TokenAllocation = artifacts.require("./TokenAllocation.sol"),
    PeriodicTokenVesting = artifacts.require("./PeriodicTokenVesting.sol"),

    Utils = require("./utils"),
    BigNumber = require('bignumber.js'),

    precision = new BigNumber("1000000000000000000"),
    privateSaleSince = parseInt(new Date().getTime() / 1000 - 3600),
    privateSaleTill = parseInt(new Date().getTime() / 1000) + 3600,
    icoSince = parseInt(new Date().getTime() / 1000 + 4600),
    icoTill = parseInt(new Date().getTime() / 1000) + 8 * 3600,
    signAddress = web3.eth.accounts[0],
    etherHolder = web3.eth.accounts[5],
    wrongSigAddress = web3.eth.accounts[7]

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
    const allocation = await TokenAllocation.new();
    await token.addMinter(allocation.address);

    return {token, privateSale, allocation};
}
contract('Allocation', function (accounts) {

    it("deploy & check constructor info", async function () {
        const {token, privateSale, allocation} = await deploy();
        console.log(allocation.address);

        await Utils.checkState({token, privateSale, allocation}, {
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
                    {["0xd339D9aeDFFa244E09874D65290c09d64b2356E0".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x26d6EF95A51BF0A2048Def4Fb7c548c3BDE37410".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x3D458b6f9024CDD9A2a7528c2E6451DD3b29e4cc".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x00dEaFC5959Dd0E164bB00D06B08d972A276bf8E".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x31b17e7a2F86d878429C03f3916d17555C0d4884".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x27B5cb71ff083Bd6a34764fBf82700b3669137f3".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x92Db818bF10Bf3BfB73942bbB1f184274aA63833".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('0').mul(precision).valueOf(),
                owner: accounts[0]
            },
            allocation: {
                ecosystemIncentive: "0xd339D9aeDFFa244E09874D65290c09d64b2356E0".toLowerCase(),
                marketingAndBounty: "0x26d6EF95A51BF0A2048Def4Fb7c548c3BDE37410".toLowerCase(),
                liquidityFund: "0x3D458b6f9024CDD9A2a7528c2E6451DD3b29e4cc".toLowerCase(),
                treasure: "0x00dEaFC5959Dd0E164bB00D06B08d972A276bf8E".toLowerCase(),
                amirShaikh: "0x31b17e7a2F86d878429C03f3916d17555C0d4884".toLowerCase(),
                sadiqHameed: "0x27B5cb71ff083Bd6a34764fBf82700b3669137f3".toLowerCase(),
                omairLatif: "0x92Db818bF10Bf3BfB73942bbB1f184274aA63833".toLowerCase(),
                icoEndTime: 0,

                vestingApplicature: "0x0000000000000000000000000000000000000000",
                vestingSimonCocking: "0x0000000000000000000000000000000000000000",
                vestingNathanChristian: "0x0000000000000000000000000000000000000000",
                vestingEdwinVanBerg: "0x0000000000000000000000000000000000000000",
            }
        });
    })
    it("check that initVesting could be called only once", async function () {
        const {token, privateSale, allocation} = await deploy();
      await  allocation.setICOEndTime(icoTill)
          .then(Utils.receiptShouldSucceed);
       await allocation.initVesting({from:accounts[2]})
    .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await allocation.initVesting({from:accounts[0]})
        allocation.initVesting({from:accounts[0]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await Utils.checkState({token, privateSale, allocation}, {
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
                    {["0xd339D9aeDFFa244E09874D65290c09d64b2356E0".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x26d6EF95A51BF0A2048Def4Fb7c548c3BDE37410".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x3D458b6f9024CDD9A2a7528c2E6451DD3b29e4cc".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x00dEaFC5959Dd0E164bB00D06B08d972A276bf8E".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x31b17e7a2F86d878429C03f3916d17555C0d4884".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x27B5cb71ff083Bd6a34764fBf82700b3669137f3".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                    {["0x92Db818bF10Bf3BfB73942bbB1f184274aA63833".toLowerCase()]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('0').mul(precision).valueOf(),
                owner: accounts[0]
            },
            allocation: {
                ecosystemIncentive: "0xd339D9aeDFFa244E09874D65290c09d64b2356E0".toLowerCase(),
                marketingAndBounty: "0x26d6EF95A51BF0A2048Def4Fb7c548c3BDE37410".toLowerCase(),
                liquidityFund: "0x3D458b6f9024CDD9A2a7528c2E6451DD3b29e4cc".toLowerCase(),
                treasure: "0x00dEaFC5959Dd0E164bB00D06B08d972A276bf8E".toLowerCase(),
                amirShaikh: "0x31b17e7a2F86d878429C03f3916d17555C0d4884".toLowerCase(),
                sadiqHameed: "0x27B5cb71ff083Bd6a34764fBf82700b3669137f3".toLowerCase(),
                omairLatif: "0x92Db818bF10Bf3BfB73942bbB1f184274aA63833".toLowerCase(),
                icoEndTime: icoTill
            }
        });
    })
    it("check that after creation & initVesting, allocate - all balances are filled (owners, funds, team)", async function () {
        const {token, privateSale, allocation} = await deploy();
        await  allocation.setICOEndTime(icoTill)
        await allocation.initVesting({from:accounts[0]})
            .then(Utils.receiptShouldSucceed);
        await allocation.allocate(token.address)
            .then(Utils.receiptShouldSucceed);
        await allocation.allocate(token.address)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await Utils.checkState({token, privateSale, allocation}, {
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
                    {["0xd339D9aeDFFa244E09874D65290c09d64b2356E0".toLowerCase()]: new BigNumber('200000000').mul(precision).valueOf()},
                    {["0x26d6EF95A51BF0A2048Def4Fb7c548c3BDE37410".toLowerCase()]: new BigNumber('50000000').mul(precision).valueOf()},
                    {["0x3D458b6f9024CDD9A2a7528c2E6451DD3b29e4cc".toLowerCase()]: new BigNumber('50000000').mul(precision).valueOf()},
                    {["0x00dEaFC5959Dd0E164bB00D06B08d972A276bf8E".toLowerCase()]: new BigNumber('200000000').mul(precision).valueOf()},
                    {["0x31b17e7a2F86d878429C03f3916d17555C0d4884".toLowerCase()]: new BigNumber('73350000').mul(precision).valueOf()},
                    {["0x27B5cb71ff083Bd6a34764fBf82700b3669137f3".toLowerCase()]: new BigNumber('36675000').mul(precision).valueOf()},
                    {["0x92Db818bF10Bf3BfB73942bbB1f184274aA63833".toLowerCase()]: new BigNumber('36675000').mul(precision).valueOf()},
                ],
                // totalSupply: new BigNumber('150000000').mul(precision).valueOf(),
                owner: accounts[0]
            },
            allocation: {
                ecosystemIncentive: "0xd339D9aeDFFa244E09874D65290c09d64b2356E0".toLowerCase(),
                marketingAndBounty: "0x26d6EF95A51BF0A2048Def4Fb7c548c3BDE37410".toLowerCase(),
                liquidityFund: "0x3D458b6f9024CDD9A2a7528c2E6451DD3b29e4cc".toLowerCase(),
                treasure: "0x00dEaFC5959Dd0E164bB00D06B08d972A276bf8E".toLowerCase(),
                amirShaikh: "0x31b17e7a2F86d878429C03f3916d17555C0d4884".toLowerCase(),
                sadiqHameed: "0x27B5cb71ff083Bd6a34764fBf82700b3669137f3".toLowerCase(),
                omairLatif: "0x92Db818bF10Bf3BfB73942bbB1f184274aA63833".toLowerCase(),
                icoEndTime: icoTill
            }
        });
    })

    it("check that created vesting has correctly inited variables (equal what was send to createVesting)", async function () {
        const {token, privateSale, allocation} = await deploy();
        await  allocation.setICOEndTime(icoTill)
        await allocation.initVesting({from:accounts[0]})
            .then(Utils.receiptShouldSucceed);
        await allocation.allocate(token.address)
            .then(Utils.receiptShouldSucceed);
//applicature
        let vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(0)) //Address of the contract, obtained from Etherscan
        assert.equal(await vesting.periods.call(), 2, 'periods is not equal');
        assert.equal(await vesting.beneficiary.call(), "0x760864dcdC58FDA80dB6883ce442B6ce44921Cf9".toLowerCase(), '_beneficiary is not equal');
        assert.equal( new BigNumber( await vesting.start.call()).valueOf(), icoTill+31536000 , 'start is not equal');
        assert.equal(await vesting.duration.call(), 31536000, 'duration is not equal');
        assert.equal(await vesting.revocable.call(), false, 'revocable is not equal');
        assert.equal(new BigNumber(await token.balanceOf.call(vesting.address)).valueOf(),
            new BigNumber(1500000).mul(precision).valueOf(), 'balance is not equal');

         vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(1)) //Address of the contract, obtained from Etherscan
        assert.equal(await vesting.periods.call(), 2, 'periods is not equal');
        assert.equal(await vesting.beneficiary.call(), "0x7f438d78a51886B24752941ba98Cc00aBA217495".toLowerCase(), '_beneficiary is not equal');
        assert.equal( new BigNumber( await vesting.start.call()).valueOf(), icoTill+31536000 , 'start is not equal');
        assert.equal(await vesting.duration.call(), 31536000, 'duration is not equal');
        assert.equal(await vesting.revocable.call(), true, 'revocable is not equal');
        assert.equal(new BigNumber(await token.balanceOf.call(vesting.address)).valueOf(),
            new BigNumber(750000).mul(precision).valueOf(), 'balance is not equal');

         vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(2)) //Address of the contract, obtained from Etherscan
        assert.equal(await vesting.periods.call(), 2, 'periods is not equal');
        assert.equal(await vesting.beneficiary.call(), "0xfD86B8B016de558Fe39B1697cBf525592A233B2c".toLowerCase(), '_beneficiary is not equal');
        assert.equal( new BigNumber( await vesting.start.call()).valueOf(), icoTill+31536000 , 'start is not equal');
        assert.equal(await vesting.duration.call(), 31536000, 'duration is not equal');
        assert.equal(await vesting.revocable.call(), true, 'revocable is not equal');
        assert.equal(new BigNumber(await token.balanceOf.call(vesting.address)).valueOf(),
            new BigNumber(750000).mul(precision), 'balance is not equal');

         vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(3)) //Address of the contract, obtained from Etherscan
        assert.equal(await vesting.periods.call(), 2, 'periods is not equal');
        assert.equal(await vesting.beneficiary.call(), "0x2451A73F35874028217bC833462CCd90c72dbE6D".toLowerCase(), '_beneficiary is not equal');
        assert.equal(await vesting.start.call(), icoTill+31536000 , 'start is not equal');
        assert.equal(await vesting.duration.call(), 31536000, 'duration is not equal');
        assert.equal(await vesting.revocable.call(), true, 'revocable is not equal');
        assert.equal(new BigNumber(await token.balanceOf.call(vesting.address)).valueOf(),
            new BigNumber(300000).mul(precision), 'balance is not equal');

    })

    it("check that METHODS could be called only by owner", async function () {
        const {token, privateSale, allocation} = await deploy();
        await  allocation.setICOEndTime(icoTill, {from: accounts[0]})
            .then(Utils.receiptShouldSucceed);
        await  allocation.setICOEndTime(icoTill, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await  allocation.createVesting(accounts[0], icoTill, 0, 31556926, 3, true, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await  allocation.createVesting(accounts[0], icoTill, 0, 31556926, 3, true)
            .then(Utils.receiptShouldSucceed)
        console.log(await allocation.vestings.call(0));
        let vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(0)) //Address of the contract, obtained from Etherscan
        assert.equal(await vesting.periods.call(), 3, 'periods is not equal');
        assert.equal(await vesting.beneficiary.call(), accounts[0], '_beneficiary is not equal');
        assert.equal(await vesting.start.call(), icoTill, 'start is not equal');
        assert.equal(await vesting.duration.call(), 31556926, 'duration is not equal');
        assert.equal(await vesting.revocable.call(), true, 'revocable is not equal');
        await token.mint(accounts[0], 2000, {from: accounts[0]})
        await token.transfer(vesting.address, 1000)
        assert.equal(new BigNumber(await vesting.vestedAmount(token.address)), 0, 'vestedAmount is not equal')




        await  allocation.createVesting(accounts[2], parseInt(new Date().getTime() / 1000) - 1, 0, 60, 2, true)
            .then(Utils.receiptShouldSucceed)

         vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(1)) //Address of the contract, obtained from Etherscan
        await token.mint(accounts[0], 2000, {from: accounts[0]})
        await token.transfer(vesting.address, 100)
        assert.equal(new BigNumber(await vesting.vestedAmount(token.address)).valueOf(), 50, 'vestedAmount is not equal')
        await vesting.release(token.address);



        await  allocation.createVesting(accounts[3], parseInt(new Date().getTime() / 1000) - 31, 0, 30, 2, true)
            .then(Utils.receiptShouldSucceed)
        await token.transfer(vesting.address, 100)
        vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(2)) //Address of the contract, obtained from Etherscan
        await token.mint(accounts[0], 2000, {from: accounts[0]})
        await token.transfer(vesting.address, 100)
        assert.equal(new BigNumber(await vesting.vestedAmount(token.address)).valueOf(), 100, 'vestedAmount is not equal')
        await vesting.release(token.address);
        Utils.balanceShouldEqualTo(token, accounts[2], 50)
        Utils.balanceShouldEqualTo(token, accounts[3], 100)

        await  allocation.createVesting(accounts[4], parseInt(new Date().getTime() / 1000) - 31, 0, 30, 3, true)
            .then(Utils.receiptShouldSucceed)
        vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(3)) //Address of the contract, obtained from Etherscan
        await token.transfer(vesting.address, 100)
        assert.equal(new BigNumber(await vesting.vestedAmount(token.address)).valueOf(), 66, 'vestedAmount is not equal')
        await vesting.release(token.address);


        await vesting.release(token.address)
    .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        Utils.balanceShouldEqualTo(token, accounts[4], 66)

        await  allocation.createVesting(accounts[5], parseInt(new Date().getTime() / 1000) - 90000, 0, 30, 2, true)
            .then(Utils.receiptShouldSucceed)
        vesting = await PeriodicTokenVesting.at(await allocation.vestings.call(4)) //Address of the contract, obtained from Etherscan
        await token.mint(accounts[0], 2000, {from: accounts[0]})
        await token.transfer(vesting.address, 100)
        assert.equal(new BigNumber(await vesting.vestedAmount(token.address)).valueOf(), 100, 'vestedAmount is not equal')
        await vesting.release(token.address);
        Utils.balanceShouldEqualTo(token, accounts[5], 100)

    });

});