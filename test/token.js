var Token = artifacts.require("../contracts/TokenERC20.sol");
var Utils = require("./utils");

var BigNumber = require('bignumber.js');
var abi = require('ethereumjs-abi');

contract('Token', function(accounts) {

  it("deploy & check for total supply", function() {
     var instance;

     return Token.new(
             "Token",
             "T",
             18,
             1000000
         ).then(function(_instance) {
             instance = _instance;
         })
     .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000));
  });

  it("transfer to account", function() {
      var instance;

      return Token.new(
              "Token",
               "T",
               18,
               1000000
      ).then(function(_instance) {
          instance = _instance;
      })
      .then(function() {
         return instance.transfer(accounts[1], 1000);
      })
      .then(Utils.receiptShouldSucceed)
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 1000))
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 999000));
  });

  it("transfer multiple transactions", function() {
      var instance;

      return Token.new(
              "Token",
               "T",
               18,
               1000000
      ).then(function(_instance) {
          instance = _instance;
      })
      .then(function() {
         return instance.transfer(accounts[1], 1000);
      })
      .then(Utils.receiptShouldSucceed)
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 1000))
      .then(function() {
         return instance.transfer(accounts[1], 1000);
      })
      .then(Utils.receiptShouldSucceed)
      .then(function() {
         return instance.transfer(accounts[1], 1000);
      })
      .then(Utils.receiptShouldSucceed)
      .then(function() {
         return instance.transfer(accounts[1], 1000);
      })
      .then(Utils.receiptShouldSucceed)
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 4000))
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 996000));
  });

  it("transfer tokens to self", function() {
      "use strict";

      var instance;

      return Token.new(
              "Token",
               "T",
               18,
               1000000
      ).then(function(_instance) {
          instance = _instance;
      })
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
      .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
      .then(function() {
          return instance.transfer(accounts[0], 1000);
      })
      .then(Utils.receiptShouldSucceed)
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
      .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
  });

  it("transfer 0 tokens", function() {
      "use strict";

      var instance;

      return Token.new(
              "Token",
               "T",
               18,
               1000000
      ).then(function(_instance) {
          instance = _instance;
      })
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
      .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
      .then(function() {
          return instance.transfer(accounts[1], 0);
      })
      .then(Utils.receiptShouldSucceed)
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[0], 1000000))
      .then(() => Utils.balanceShouldEqualTo(instance, accounts[1], 0))
      .then(() => Utils.balanceShouldEqualTo(instance, instance.address, 0))
  });

});
