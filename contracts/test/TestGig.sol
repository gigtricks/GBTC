pragma solidity ^0.4.18;

import "../GigToken.sol";

contract TestGig is GigToken {
    function TestGig(
        bool _locked
    ) public GigToken(_locked)
    { }

    function testSetFreezing(bool _isFrozen) public {
        transferFrozen = _isFrozen;
    }

}
