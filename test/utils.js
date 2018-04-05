var BigNumber = require('bignumber.js');

var gasToUse = 0x47E7C4;

function receiptShouldSucceed(result) {
    return new Promise(function(resolve, reject) {
        var receipt = web3.eth.getTransaction(result.tx);

        if(result.receipt.gasUsed == gasToUse) {
            try {
               console.log(result.receipt.gasUsed, gasToUse);
                assert.notEqual(result.receipt.gasUsed, gasToUse, "tx failed, used all gas");
            }
            catch(err) {
                reject(err);
            }
        }
        else {
            resolve();
        }
    });
}

function receiptShouldFailed(result) {
    return new Promise(function(resolve, reject) {
        var receipt = web3.eth.getTransaction(result.tx);

        if(result.receipt.gasUsed == gasToUse) {
            resolve();
        }
        else {
            try {
                assert.equal(result.receipt.gasUsed, gasToUse, "tx succeed, used not all gas");
            }
            catch(err) {
                reject(err);
            }
        }
    });
}

function catchReceiptShouldFailed(err) {
    if (err.message.indexOf("invalid opcode") == -1 && err.message.indexOf("revert") == -1) {
        throw err;
    }
}

function balanceShouldEqualTo(instance, address, expectedBalance, notCall) {
    return new Promise(function(resolve, reject) {
        var promise;

        if(notCall) {
            promise = instance.balanceOf(address)
                .then(function() {
                    return instance.balanceOf.call(address);
                });
        }
        else {
            promise = instance.balanceOf.call(address);
        }

        promise.then(function(balance) {
            try {
                assert.equal(balance.valueOf(), expectedBalance, "balance is not equal");
            }
            catch(err) {
                reject(err);

                return;
            }

            resolve();
        });
    });
}

function totalShouldEqualTo(instance, expected) {
    return new Promise(function(resolve, reject) {
        var promise;

        promise = instance.totalSupply();

        promise.then(function(amount) {
            try {
                assert.equal(amount.valueOf(), expected, "total is not equal");
            }
            catch(err) {
                reject(err);

                return;
            }

            resolve();
        });
    });
}

function mintedShouldEqualTo(instance, expected) {
    return new Promise(function(resolve, reject) {
        var promise;

        promise = instance.minted();

        promise.then(function(amount) {
            try {
                assert.equal(amount.valueOf(), expected, "minted is not equal");
            }
            catch(err) {
                reject(err);

                return;
            }

            resolve();
        });
    });
}

function tokenMetaDataShouldExists(instance, tokenId) {
    return new Promise(function(resolve, reject) {
        var promise;

        promise = instance.tokenMetadata(tokenId);

        promise.then(function(res) {
            try {
               var lengthBiggerThenZero = res.length > 0;
               assert.equal(lengthBiggerThenZero, true, "meta data is not exists");
            }
            catch(err) {
                reject(err);

                return;
            }

            resolve();
        });
    });
}

function shouldTakeTokenByIndex(instance, address, index, expected) {
    return new Promise(function(resolve, reject) {
        var promise;

        promise = instance.tokenOfOwnerByIndex(address, index);

        promise.then(function(res) {
            try {
               assert.equal(res.valueOf(), expected, "expected tokenId is not equal");
            }
            catch(err) {
                reject(err);

                return;
            }

            resolve();
        });
    });
}

function getDividend(instance, id) {
    return instance.dividends.call(id)
        .then(function(obj) {
            return {
                id: obj[0].valueOf(),
                block: obj[1].valueOf(),
                time: obj[2].valueOf(),
                amount: obj[3].valueOf(),

                claimedAmount: obj[4].valueOf(),
                transferedBack: obj[5].valueOf(),

                totalSupply: obj[6].valueOf(),
                recycleTime: obj[7].valueOf(),

                recycled: obj[8],

                claimed: obj[9]
            }
        });
}

function checkDividend(dividend, id, amount, claimedAmount, transferedBack, totalSupply, recycleTime, recycled) {
    return new Promise(function(resolve, reject) {
        try {
            assert.equal(dividend.id, id, "dividend id is not equal");
            assert.equal(dividend.amount, amount, "dividend amount id is not equal");
            assert.equal(dividend.claimedAmount, claimedAmount, "dividend claimed amount is not equal");
            assert.equal(dividend.transferedBack, transferedBack, "dividend transfered back is not equal");
            assert.equal(dividend.totalSupply, totalSupply, "dividend total supply is not equal");
            assert.equal(dividend.recycleTime, recycleTime, "dividend recycle time is not equal");
            assert.equal(dividend.recycled, recycled, "dividend recycled is not equal");

            resolve();
        }
        catch(err) {
            reject(err);
        }
    });
}

function getEmission(instance, id) {
    "use strict";

    return instance.emissions.call(id)
        .then(function(obj) {
            return {
                blockDuration: obj[0].valueOf(),
                blockTokens: obj[1].valueOf(),
                periodEndsAt: obj[2].valueOf(),
                removed: obj[3].valueOf()
            }
        });
}

function checkEmission(emission, blockDuration, blockTokens, periodEndsAt, removed) {
    "use strict";

    return new Promise(function(resolve, reject) {
        try {
            assert.equal(emission.blockDuration, blockDuration, "emission blockDuration is not equal");
            assert.equal(emission.blockTokens, blockTokens, "emission blockTokens is not equal");
            assert.equal(emission.periodEndsAt, periodEndsAt, "emission periodEndsAt is not equal");
            assert.equal(emission.removed, removed, "emission removed is not equal");

            resolve();
        }
        catch(err) {
            reject(err);
        }
    });
}

function checkClaimedTokensAmount(instance, offsetDate, lastClaimedAt, currentTime, currentBalance, totalSupply, expectedValue) {
    return instance.calculateEmissionTokens(offsetDate + lastClaimedAt, offsetDate + currentTime, currentBalance, totalSupply)
        .then(function() {
            return instance.calculateEmissionTokens.call(offsetDate + lastClaimedAt, offsetDate + currentTime, currentBalance, totalSupply);
        })
        .then(function(result) {
            assert.equal(result.valueOf(), expectedValue.valueOf(), "amount is not equal");
        });
}

function getPhase(instance, id) {
    return instance.phases.call(id)
        .then(function(obj) {
            if(obj.length == 3) {
                return {
                    priceShouldMultiply: obj[0].valueOf(),
                    price: obj[1].valueOf(),
                    maxAmount: obj[2].valueOf(),
                }
            }

            return {
                price: obj[0].valueOf(),
                maxAmount: obj[1].valueOf(),
            }
        });
}

function checkPhase(phase, price, maxAmount) {
    return new Promise(function(resolve, reject) {
        try {
            assert.equal(phase.price, price, "phase price is not equal");
            assert.equal(phase.maxAmount, maxAmount, "phase maxAmount is not equal");

            resolve();
        }
        catch(err) {
            reject(err);
        }
    });
}

function timeout(timeout) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, timeout * 1000);
    })
}

function getEtherBalance(_address) {
    return web3.eth.getBalance(_address);
}

function checkEtherBalance(_address, expectedBalance) {
    var balance = web3.eth.getBalance(_address);

    assert.equal(balance.valueOf(), expectedBalance.valueOf(), "address balance is not equal");
}

function getTxCost(result) {
    var tx = web3.eth.getTransaction(result.tx);

    return result.receipt.gasUsed * tx.gasPrice;
}

module.exports = {
    receiptShouldSucceed: receiptShouldSucceed,
    receiptShouldFailed: receiptShouldFailed,
    catchReceiptShouldFailed: catchReceiptShouldFailed,
    balanceShouldEqualTo: balanceShouldEqualTo,
    totalShouldEqualTo: totalShouldEqualTo,
    mintedShouldEqualTo: mintedShouldEqualTo,
    tokenMetaDataShouldExists: tokenMetaDataShouldExists,
    shouldTakeTokenByIndex: shouldTakeTokenByIndex,
    getDividend: getDividend,
    checkDividend: checkDividend,
    getPhase: getPhase,
    checkPhase: checkPhase,
    getEmission: getEmission,
    checkEmission: checkEmission,
    checkClaimedTokensAmount: checkClaimedTokensAmount,
    timeout: timeout,
    getEtherBalance: getEtherBalance,
    checkEtherBalance: checkEtherBalance,
    getTxCost: getTxCost
};
