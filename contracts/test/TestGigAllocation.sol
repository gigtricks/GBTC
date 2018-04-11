pragma solidity ^0.4.18;


import "../GigAllocation.sol";


contract TestGigAllocation is GigAllocation {

    function TestGigAllocation(
        address _token,
        address _ico,
        uint256 _remainingTokens, //150000000000000000000000000
        address _ecosystemIncentive,
        address _marketingBounty,
        address _liquidityFund,
        address _treasury
    ) public GigAllocation(
        _token,
        _ico,
        _remainingTokens, //150000000000000000000000000
        _ecosystemIncentive,
        _marketingBounty,
        _liquidityFund,
        _treasury
    ) {}

    function testChangeRemainingTokens(uint256 _val) public {
        remainingTokens = _val;
    }
}