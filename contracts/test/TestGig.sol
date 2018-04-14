pragma solidity ^0.4.18;

import "../GigToken.sol";

contract TestGig is GigToken {
    function TestGig(
        bool _locked,
        uint256 _icoEndTime
    ) public GigToken(_locked, _icoEndTime)
    { }

    function testSetFreezing(bool _isFrozen) public {
        transferFrozen = _isFrozen;
    }

}
