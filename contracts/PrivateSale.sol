pragma solidity 0.4.19;


import './SellableToken.sol';

/*
    Tests:
    - check that contributor tokens are locked at token contract
    - check that token price calculations are correct
    - check that ethers calculations are correct
    - check that contributor cannot exceed max supply for this tier
    - check that change sale period can be called only by admin
    - check that change sale period method changes sale period
    - check that moveUnsoldTokens is can be called only after private sale
*/

contract PrivateSale is SellableToken {

    uint256 public price;
    uint256 public discount;
    SellableToken public crowdSale;

    function PrivateSale(
        address _token,
        address _etherHolder,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxTokenSupply, //14000000000000000000000000
        uint256 _etherPriceInUSD
    ) public SellableToken(
        _token,
        _etherHolder,
        _startTime,
        _endTime,
        _maxTokenSupply,
        _etherPriceInUSD
    ) {
        price = 24800;// $0.2480 * 10 ^ 5
        discount = 75;// $75%
    }

    function changeSalePeriod(uint256 _start, uint256 _end) public onlyOwner {
        if (_start != 0 && _start < _end) {
            startTime = _start;
            endTime = _end;
        }
    }

    function isActive() public view returns (bool) {
        if (soldTokens == maxTokenSupply) {
            return false;
        }

        return withinPeriod();
    }

    function withinPeriod() public view returns (bool) {
        return block.timestamp >= startTime && block.timestamp <= endTime;
    }

    function calculateTokensAmount(uint256 _value) public view returns (uint256 tokenAmount, uint256 usdAmount) {
        if (_value == 0) {
            return (0, 0);
        }

        usdAmount = _value.mul(etherPriceInUSD);

        tokenAmount = usdAmount.div(price * (100 - discount) / 100);

        usdAmount = usdAmount.div(uint256(10) ** 18);

        if (usdAmount < minPurchase) {
            return (0, 0);
        }
    }

    function calculateEthersAmount(uint256 _tokens) public view returns (uint256 ethers, uint256 usdAmount) {
        if (_tokens == 0) {
            return (0, 0);
        }

        usdAmount = _tokens.mul((price * (100 - discount) / 100));
        ethers = usdAmount.div(etherPriceInUSD);

        if (ethers < getMinEthersInvestment()) {
            return (0, 0);
        }

        usdAmount = usdAmount.div(uint256(10) ** 18);
    }

    function getStats(uint256 _ethPerBtc) public view returns (
        uint256 start,
        uint256 end,
        uint256 sold,
        uint256 maxSupply,
        uint256 min,
        uint256 tokensPerEth,
        uint256 tokensPerBtc
    ) {
        start = startTime;
        end = endTime;
        sold = soldTokens;
        maxSupply = maxTokenSupply;
        min = minPurchase;
        uint256 usd;
        (tokensPerEth, usd) = calculateTokensAmount(1 ether);
        (tokensPerBtc, usd) = calculateTokensAmount(_ethPerBtc);
    }

    function setCrowdSale(address _crowdSale) public onlyOwner {
        require(_crowdSale != address(0));

        crowdSale = SellableToken(_crowdSale);
    }

    function moveUnsoldTokens() public onlyOwner {
        require(address(crowdSale) != address(0) && now >= endTime && !isActive() && maxTokenSupply > soldTokens);

        crowdSale.updatePreICOMaxTokenSupply(maxTokenSupply.sub(soldTokens));
        maxTokenSupply = soldTokens;
    }

    function updatePreICOMaxTokenSupply(uint256) public {
        require(false);
    }

    function isTransferAllowed(address, uint256) public view returns (bool) {
        return false;
    }

    function buy(address _address, uint256 _value) internal returns (bool) {
        if (_value == 0 || _address == address(0)) {
            return false;
        }

        uint256 tokenAmount;
        uint256 usdAmount;

        (tokenAmount, usdAmount) = calculateTokensAmount(_value);

        uint256 mintedAmount = mintInternal(_address, tokenAmount);
        collectedUSD = collectedUSD.add(usdAmount);
        require(usdAmount > 0 && mintedAmount > 0);

        collectedEthers = collectedEthers.add(_value);
        etherBalances[_address] = etherBalances[_address].add(_value);

        token.increaseLockedBalance(_address, mintedAmount);

        transferEthers();

        Contribution(_address, _value, tokenAmount);
        return true;
    }

    function transferEthers() internal {
        etherHolder.transfer(this.balance);
    }
}
