pragma solidity 0.4.19;

import "./MintingERC20.sol";
import "./SellableToken.sol";


/*
    Tests:
    - check that created token has correct name, symbol, decimals, locked, maxSupply
    - check that setPrivateSale updates privateSale, and not affects crowdSaleEndTime
    - check that setCrowdSale updates crowdSale, and changes crowdSaleEndTime
    - check that trasnferFrom, approve, increaseApproval, decreaseApproval are forbidden to call before end of ICO
    - check that burn is not allowed to call before end of CrowdSale
    - check that increaseLockedBalance only increases investor locked amount
    - check that isTransferAllowed failed if transferFrozen
    - check that isTransferAllowed failed if user has not enough unlocked balance
    - check that isTransferAllowed failed if user has not enough unlocked balance, after transfering enough tokens balance
    - check that isTransferAllowed succeed if user has enough unlocked balance
    - check that isTransferAllowed succeed if user has enough unlocked balance, after transfering enough tokens balance
*/

contract GigToken is MintingERC20 {
    SellableToken public crowdSale; // Pre ICO & ICO
    SellableToken public privateSale;

    bool public transferFrozen = false;

    uint256 public crowdSaleEndTime;

    mapping(address => uint256) public lockedBalancesReleasedAfterOneYear;

    modifier onlyCrowdSale() {
        require(crowdSale != address(0) && msg.sender == crowdSale);

        _;
    }

    modifier onlySales() {
        require((privateSale != address(0) && msg.sender == privateSale) ||
            (crowdSale != address(0) && msg.sender == crowdSale));

        _;
    }

    event MaxSupplyBurned(uint256 burnedTokens);

    function GigToken(bool _locked) public
        MintingERC20(0, maxSupply, "GigBit", 18, "GBTC", false, _locked)
    {
        standard = "GBTC 0.1";

        maxSupply = uint256(1000000000).mul(uint256(10) ** decimals);
    }

    function setICO(address _crowdSale) public onlyOwner {
        require(_crowdSale != address(0));

        crowdSale = SellableToken(_crowdSale);

        crowdSaleEndTime = crowdSale.endTime();
    }

    function setPrivateSale(address _privateSale) public onlyOwner {
        require(_privateSale != address(0));

        privateSale = SellableToken(_privateSale);
    }

    function freezing(bool _transferFrozen) public onlyOwner {
        transferFrozen = _transferFrozen;
    }

    function isTransferAllowed(address _from, uint256 _value) public view returns (bool status) {
        if (transferFrozen == true) {
            return false;
        }

        uint256 senderBalance = balanceOf(_from);
        uint256 lockedBalance = lockedBalancesReleasedAfterOneYear[_from];


        // check if holder tries to transfer more than locked tokens
        if (lockedBalance > 0) {
            uint256 unlockTime = icoEndTime + 1 years;

            // fail if unlock time is not come
            if (block.timestamp < unlockTime) {
                return false;
            }

            uint256 secsFromUnlock = block.timestamp.sub(unlockTime);

            // number of months over from unlock
            uint256 months = secsFromUnlock / 30;

            if (months > 12) {
                months = 12;
            }

            uint256 tokensPerMonth = lockedBalance / 12;

            uint256 unlockedBalance = tokensPerPeriod.mul(months); // 600k unlocked tokens

            uint256 actualLockedBalance = lockedBalance.sub(unlockedBalance);

            if (senderBalance.sub(_value) < actualLockedBalance) {
                return false;
            }
        }

        // Prevent transfering of tokens before Soft CAP reached (need to double check with Amir)
        if (block.timestamp < crowdSaleEndTime &&
            crowdSale != address(0) &&
            crowdSale.isTransferAllowed(_from, _value) == false
        ) {
            return false;
        }

        return true;
    }

    function transfer(address _to, uint _value) public returns (bool) {
        require(isTransferAllowed(msg.sender, _value));

        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint _value) public returns (bool success) {
        // transferFrom & approve are disabled before end of ICO
        require((crowdSaleEndTime <= block.timestamp) && isTransferAllowed(_from, _value));

        return super.transferFrom(_from, _to, _value);
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        // transferFrom & approve are disabled before end of ICO

        require(crowdSaleEndTime <= block.timestamp);

        return super.approve(_spender, _value);
    }

    function increaseApproval(address _spender, uint _addedValue) public returns (bool success) {
        // transferFrom & approve are disabled before end of ICO

        require(crowdSaleEndTime <= block.timestamp);

        return super.increaseApproval(_spender, _addedValue);
    }

    function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool success) {
        // transferFrom & approve are disabled before end of ICO

        require(crowdSaleEndTime <= block.timestamp);

        return super.decreaseApproval(_spender, _subtractedValue);
    }

    function increaseLockedBalance(address _address, uint256 _tokens) onlySales {
        lockedBalancesReleasedAfterOneYear[_address] =
            lockedBalancesReleasedAfterOneYear[_address].add(_tokens);
    }

    // burn tokens if soft cap is not reached
    function burnInvestorTokens(
        address _address,
        uint256 _amount
    ) public onlyCrowdSale returns (uint256) {
        require(block.timestamp > crowdSaleEndTime);

        require(_amount <= balances[_address]);

        balances[_address] = balances[_address].sub(_amount);

        totalSupply_ = totalSupply_.sub(_amount);

        Transfer(_address, address(0), _amount);

        return _amount;
    }

    // decrease max supply of tokens that are not sold
    function burnUnsoldTokens(uint256 _amount) public onlyCrowdSale {
        require(block.timestamp > crowdSaleEndTime);

        maxSupply = maxSupply.sub(_amount);

        MaxSupplyBurned(_amount);
    }
}
