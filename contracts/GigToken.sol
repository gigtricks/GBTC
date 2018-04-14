pragma solidity 0.4.19;

import "./MintingERC20.sol";
import "./CrowdSale.sol";
import "./GigAllocation.sol";


contract GigToken is MintingERC20 {

    CrowdSale public ico;
    GigAllocation public allocations;

    bool public transferFrozen = true;
    mapping(address => bool) trustedBurners;
    modifier onlyTrustedBurnersAddress(address _address) {
        require(trustedBurners[_address] == true);
        _;
    }

    function GigToken(bool _locked) public
    MintingERC20(0, maxSupply, "GigBit", 18, "GBTC", false, _locked)
    {
        standard = "GBTC 0.1";
        maxSupply = uint256(1000000000).mul(uint256(10) ** decimals);
    }

    function setICO(address _ico) public onlyOwner {
        require(_ico != address(0));
        ico = CrowdSale(_ico);
        trustedBurners[_ico] = true;
    }

    // privateSale, CrowdSale, Allocation contracts
    function updateBurnerAddresses(address _address, bool _status) public onlyOwner {
        require(_address != address(0));
        trustedBurners[_address] = _status;
    }

    function setAllocationContract(address _allocations) public onlyOwner {
        require(_allocations != address(0));
        allocations = GigAllocation(_allocations);
        trustedBurners[_allocations] = true;
    }

    function freezing(bool _transferFrozen) public onlyOwner {
        transferFrozen = _transferFrozen;
    }

    function isTransferAllowed(address _from, uint256 _value) public view returns (bool status) {
        return !transferFrozen
        && allocations.isAllowedToTransfer(_from, balanceOf(_from), _value)
        && ico.isTransferAllowed(_from, _value);
    }

    function transfer(address _to, uint _value) public returns (bool) {
        require(isTransferAllowed(msg.sender, _value));
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint _value) public returns (bool success) {
        if (!isTransferAllowed(_from, _value)) {
            return false;
        }
        return super.transferFrom(_from, _to, _value);
    }

    function burnInvestorTokens(
        address _address,
        uint256 _amount
    ) public onlyTrustedBurnersAddress(msg.sender) returns (uint256) {
        return burnInternal(_address, _amount);
    }

    function burnUnsoldTokens(uint256 _amount) public onlyTrustedBurnersAddress(msg.sender) {
        maxSupply = maxSupply.sub(_amount);
    }

    function burnInternal(address _address, uint256 _amount) internal returns (uint256) {
        require(_amount <= balances[_address]);
        balances[_address] = balances[_address].sub(_amount);
        totalSupply_ = totalSupply_.sub(_amount);
        Transfer(_address, address(0), _amount);
        return _amount;
    }

}
