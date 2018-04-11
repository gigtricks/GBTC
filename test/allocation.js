// var
//     PrivateSale = artifacts.require("./PrivateSale.sol"),
//     PreICO = artifacts.require("./PreICO.sol"),
//     ICO = artifacts.require("./test/TestICO.sol"),
//     SupplyBloc = artifacts.require("./test/TestSupplyBloc.sol"),
//     SupplyBlocAllocation = artifacts.require("./test/TestSupplyBlocAllocation.sol"),
//
//     Utils = require("./utils"),
//     BigNumber = require('BigNumber.js'),
//
//     precision = new BigNumber("1000000000000000000"),
//     usdPrecision = new BigNumber("100000"),
//     icoSince = parseInt(new Date().getTime() / 1000 - 3600 * 2),
//     icoTill = parseInt(new Date().getTime() / 1000) - 3600,
//     monthSeconds = 2629744,
//     signAddress = web3.eth.accounts[0],
//     etherHolder = web3.eth.accounts[5],
//     wrongSigAddress = web3.eth.accounts[7],
//     rewardsAddress = web3.eth.accounts[8];
//
// var abi = require('ethereumjs-abi'),
//     BN = require('bn.js');
//
// function makeTransactionKYC(instance, sign, address, value) {
//     'use strict';
//     var h = abi.soliditySHA3(['address'], [new BN(address.substr(2), 16)]),
//         sig = web3.eth.sign(sign, h.toString('hex')).slice(2),
//         r = `0x${sig.slice(0, 64)}`,
//         s = `0x${sig.slice(64, 128)}`,
//         v = web3.toDecimal(sig.slice(128, 130)) + 27;
//
//     var data = abi.simpleEncode('multivestBuy(address,uint8,bytes32,bytes32)', address, v, r, s);
//
//     return instance.sendTransaction({value: value, from: address, data: data.toString('hex')});
// }
//
// async function deploy() {
//     const token = await SupplyBloc.new(rewardsAddress, false);
//     // const privateico = await PrivateSale.new(
//     //     token.address, //_token
//     //     etherHolder, //_etherHolder
//     //     icoSince, //_startTime
//     //     icoTill,//_endTime
//     //     new BigNumber('119493000').valueOf(), //_etherPriceInUSD
//     //     new BigNumber('15000000').mul(precision).valueOf(),//_maxTokenSupply
//     //     true //_activeWhitelist
//     // );
//     // const preico = await PreICO.new(
//     //     token.address, //_token
//     //     etherHolder, //_etherHolder
//     //     icoSince, //_startTime
//     //     icoTill,//_endTime
//     //     new BigNumber('119493000'), //_etherPriceInUSD
//     //     new BigNumber('54000000').mul(precision).valueOf()//_maxTokenSupply
//     // );
//     const ico = await ICO.new(
//         token.address, //_token
//         etherHolder, //_etherHolder
//         icoSince, //_startTime
//         icoTill,//_endTime
//         new BigNumber('119493000'), //_etherPriceInUSD
//         new BigNumber('726250000').mul(precision).valueOf()//_maxTokenSupply
//     );
//     const allocations = await SupplyBlocAllocation.new(token.address, ico.address);
//
//     await token.addMinter(ico.address);
//     await token.addMinter(allocations.address);
//     await token.setICO(ico.address);
//     await ico.setAllowedMultivest(signAddress);
//
//     return {token, ico, ico, ico, allocations};
// }
//
// contract('Allocations + vesting allocation', function (accounts) {
//
//     it('deploy & check constructor info & setSupplyBloc & setICO', async function () {
//         const {token, privateico, preico, ico, allocations} = await deploy();
//
//         await Utils.checkState({allocations}, {
//             allocations: {
//                 token: token.address,
//                 ico: ico.address,
//                 remainingTokens: new BigNumber('50000000').mul(precision).valueOf()
//             }
//         });
//
//         await allocations.setSupplyBloc(accounts[2], {from: accounts[1]})
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//         await allocations.setSupplyBloc(0x0)
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//         await allocations.setSupplyBloc(accounts[2])
//             .then(Utils.receiptShouldSucceed);
//
//         await allocations.setICO(accounts[2], {from: accounts[1]})
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//         await allocations.setICO(0x0)
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//         await allocations.setICO(accounts[2])
//             .then(Utils.receiptShouldSucceed);
//
//         await Utils.checkState({allocations}, {
//             allocations: {
//                 token: accounts[2],
//                 ico: accounts[2],
//                 remainingTokens: new BigNumber('50000000').mul(precision).valueOf()
//             }
//         });
//
//     });
//
//     it('check Allocation & claim & allocate', async function () {
//         const {token, privateico, preico, ico, allocations} = await deploy();
//
//         await Utils.checkState({allocations}, {
//             allocations: {
//                 token: token.address,
//                 ico: ico.address,
//                 remainingTokens: new BigNumber('50000000').mul(precision).valueOf()
//             }
//         });
//
//         assert.equal(await allocations.testGetAllocationsLength.call(), 1, "AllocationsLength is not equal");
//
//         let allocationData = await allocations.testGetAllocationById.call(0);
//         assert.equal(allocationData[0], accounts[0], "allocationData address is not equal");
//         assert.equal(allocationData[1], new BigNumber('30000000').mul(precision).valueOf(), "allocationData tokens is not equal");
//         assert.equal(allocationData[2], false, "allocationData sent is not equal");
//
//         await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
//             accounts[0],
//             accounts[1],
//             accounts[2],
//         ], {from: accounts[5]})
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//
//         await allocations.setAllocation(new BigNumber('0').mul(precision).valueOf(),[
//             accounts[0],
//             accounts[1],
//             accounts[2],
//         ])
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//
//         await allocations.testChangeRemainingTokens(0);
//         await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
//             accounts[0],
//             accounts[1],
//             accounts[2],
//         ])
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//         await allocations.testChangeRemainingTokens(new BigNumber('50000000').mul(precision).valueOf());
//
//         await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[])
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//
//         await allocations.testChangeRemainingTokens(new BigNumber('1').valueOf());
//         await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
//             accounts[0],
//             accounts[1],
//             accounts[2],
//         ])
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//         await allocations.testChangeRemainingTokens(new BigNumber('50000000').mul(precision).valueOf());
//
//         await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
//             accounts[0],
//             0x0,
//             accounts[2],
//         ])
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//
//         await allocations.setAllocation(new BigNumber('10000').mul(precision).valueOf(),[
//             accounts[1],
//             accounts[2],
//             accounts[3],
//         ])
//             .then(Utils.receiptShouldSucceed);
//
//         await allocations.claim({from: accounts[2]})
//             .then(Utils.receiptShouldSucceed);
//
//         allocationData = await allocations.testGetAllocationById.call(0);
//         assert.equal(allocationData[2], false, "allocationData sent is not equal");
//         allocationData = await allocations.testGetAllocationById.call(1);
//         assert.equal(allocationData[2], false, "allocationData sent is not equal");
//         allocationData = await allocations.testGetAllocationById.call(2);
//         assert.equal(allocationData[2], true, "allocationData sent is not equal");
//         allocationData = await allocations.testGetAllocationById.call(3);
//         assert.equal(allocationData[2], false, "allocationData sent is not equal");
//
//         await Utils.checkState({allocations, token}, {
//             allocations: {
//                 token: token.address,
//                 ico: ico.address,
//                 remainingTokens: new BigNumber('50000000').mul(precision).sub(new BigNumber('30000').mul(precision)).valueOf()
//             },
//             token: {
//                 balanceOf: [
//                     {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
//                     {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('10000').mul(precision).valueOf()},
//                     {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
//                 ],
//             }
//         });
//
//         await allocations.claim({from: accounts[2]})
//             .then(Utils.receiptShouldSucceed);
//
//         await Utils.checkState({allocations, token}, {
//             allocations: {
//                 token: token.address,
//                 ico: ico.address,
//                 remainingTokens: new BigNumber('50000000').mul(precision).sub(new BigNumber('30000').mul(precision)).valueOf()
//             },
//             token: {
//                 balanceOf: [
//                     {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
//                     {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('10000').mul(precision).valueOf()},
//                     {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
//                 ],
//             }
//         });
//
//         await allocations.allocate({from: accounts[2]})
//             .then(Utils.receiptShouldFailed)
//             .catch(Utils.catchReceiptShouldFailed);
//
//         await allocations.allocate()
//             .then(Utils.receiptShouldSucceed);
//
//         await Utils.checkState({allocations, token}, {
//             allocations: {
//                 token: token.address,
//                 ico: ico.address,
//                 remainingTokens: new BigNumber('50000000').mul(precision).sub(new BigNumber('30000').mul(precision)).valueOf()
//             },
//             token: {
//                 balanceOf: [
//                     {[accounts[0]]: new BigNumber('30000000').mul(precision).valueOf()},
//                     {[accounts[1]]: new BigNumber('10000').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('10000').mul(precision).valueOf()},
//                     {[accounts[3]]: new BigNumber('10000').mul(precision).valueOf()},
//                 ],
//             }
//         });
//
//         allocationData = await allocations.testGetAllocationById.call(0);
//         assert.equal(allocationData[2], true, "allocationData sent is not equal");
//         allocationData = await allocations.testGetAllocationById.call(1);
//         assert.equal(allocationData[2], true, "allocationData sent is not equal");
//         allocationData = await allocations.testGetAllocationById.call(2);
//         assert.equal(allocationData[2], true, "allocationData sent is not equal");
//         allocationData = await allocations.testGetAllocationById.call(3);
//         assert.equal(allocationData[2], true, "allocationData sent is not equal");
//     });
//
//     it('check vesting allocations', async function () {
//         const {token, privateico, preico, ico, allocations} = await deploy();
//
//         await Utils.checkState({allocations, token}, {
//             token: {
//                 balanceOf: [
//                     {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
//                     {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
//                 ],
//             }
//         });
//
//         await allocations.allocate()
//             .then(Utils.receiptShouldSucceed);
//         await Utils.checkState({allocations, token}, {
//             token: {
//                 balanceOf: [
//                     {[accounts[0]]: new BigNumber('30000000').mul(precision).valueOf()},
//                     {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
//                 ],
//             }
//         });
//
//         await allocations.testAllocate(parseInt(new Date().getTime() / 1000) + monthSeconds)
//             .then(Utils.receiptShouldSucceed);
//         await Utils.checkState({allocations, token}, {
//             token: {
//                 balanceOf: [
//                     {[accounts[0]]: new BigNumber('30000000').mul(precision).valueOf()},
//                     {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('100000000').mul(precision).valueOf()},
//                 ],
//             }
//         });
//
//         await allocations.testAllocate(parseInt(new Date().getTime() / 1000) + monthSeconds * 2)
//             .then(Utils.receiptShouldSucceed);
//         await Utils.checkState({allocations, token}, {
//             token: {
//                 balanceOf: [
//                     {[accounts[0]]: new BigNumber('30000000').mul(precision).valueOf()},
//                     {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('200000000').mul(precision).valueOf()},
//                 ],
//             }
//         });
//
//         await allocations.testAllocate(parseInt(new Date().getTime() / 1000) + monthSeconds * 3)
//             .then(Utils.receiptShouldSucceed);
//         await Utils.checkState({allocations, token}, {
//             token: {
//                 balanceOf: [
//                     {[accounts[0]]: new BigNumber('30000000').mul(precision).valueOf()},
//                     {[accounts[1]]: new BigNumber('150000000').mul(precision).valueOf()},
//                     {[accounts[2]]: new BigNumber('300000000').mul(precision).valueOf()},
//                 ],
//             }
//         });
//
//     });
//
// });