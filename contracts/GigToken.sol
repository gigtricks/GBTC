pragma solidity 0.4.19;

import "./MintingERC20.sol";
import "./SellableToken.sol";
import "./GigAllocation.sol";


contract GigToken is MintingERC20 {

    SellableToken public ico;
    SellableToken public privateSale;
    GigAllocation public allocations;

    bool public transferFrozen = true;
    mapping(address => uint256) public lockedHolders;

    modifier onlySellable() {
        require(msg.sender == address(ico) || msg.sender == address(privateSale));
        _;
    }

    function GigToken(
        bool _locked
    ) public MintingERC20(0, maxSupply, "GigBit", 18, "GBTC", false, _locked)
    {
        standard = "GBTC 0.1";
        maxSupply = uint256(1000000000).mul(uint256(10) ** decimals);
    }

    function setICO(address _ico) public onlyOwner {
        require(_ico != address(0));
        ico = SellableToken(_ico);
    }

    function setPrivateSale(address _privateSale) public onlyOwner {
        require(_privateSale != address(0));
        privateSale = SellableToken(_privateSale);
    }

    function setAllocationContract(address _allocations) public onlyOwner {
        require(_allocations != address(0));
        allocations = GigAllocation(_allocations);
    }

    function setLocked(bool _locked) public onlyOwner {
        locked = _locked;
    }

    function freezing(bool _transferFrozen) public onlyOwner {
        transferFrozen = _transferFrozen;
    }

    function isTransferAllowed(address _from, uint256 _value) public view returns (bool status) {
//        @todo  adds  value checking for allocation
        return !transferFrozen
        && allocations.isTransferAllowed(_from, _value)
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

    function burnInvestorTokens(address _address) public returns (uint256) {
        if (address(ico) == msg.sender || address(privateSale) == msg.sender) {
            return burnInternal(_address);
        }
        return 0;
    }

    function burnUnsoldTokens(uint256 _amount) public onlySellable {
        Transfer(address(this), address(0), maxSupply.sub(_amount));
        maxSupply = maxSupply.sub(_amount);
    }


    function burnInternal(address _address) internal returns (uint256 amount) {
        amount = balances[_address];
        balances[_address] = 0;
        totalSupply_ = totalSupply_.sub(amount);
        Transfer(_address, address(0), amount);
    }

}
