pragma solidity ^0.4.18;


import "../PrivateSale.sol";


contract TestPrivateSale is PrivateSale {

    function TestPrivateSale(
        address _token,
        address _etherHolder,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxTokenSupply,
        uint256 _etherPriceInUSD
    ) public PrivateSale(
        _token,
        _etherHolder,
        _startTime,
        _endTime,
        _maxTokenSupply,
        _etherPriceInUSD
    ) {}

    function testChangeSoldTokens(uint256 _sold) public {
        soldTokens = _sold;
    }

}
