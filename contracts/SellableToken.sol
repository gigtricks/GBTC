pragma solidity 0.4.19;

import "./GigToken.sol";
import "./Multivest.sol";
import "./GigAllocation.sol";


contract SellableToken is Multivest {
    uint256 public constant MONTH_IN_SEC = 2629743;
    GigToken public token;
    GigAllocation public allocation;

    uint256 public minPurchase = 100 * 10 ** 5;
    uint256 public maxPurchase;

    uint256 public softCap;
    uint256 public hardCap;

    uint256 public startTime;
    uint256 public endTime;

    uint256 public maxTokenSupply;

    uint256 public soldTokens;

    uint256 public collectedEthers;

    address public etherHolder;

    uint256 public collectedUSD;

    uint256 public etherPriceInUSD;
    uint256 public priceUpdateAt;

    mapping(address => uint256) public etherBalances;

    Tier[] public tiers;

    struct Tier {
        uint256 discount;
        uint256 startTime;
        uint256 endTime;
    }

    event Refund(address _holder, uint256 _ethers, uint256 _tokens);
    event NewPriceTicker(string _price);

    function SellableToken(
        address _token,
        address _etherHolder,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _maxTokenSupply,
        uint256 _etherPriceInUSD
    )
    public Multivest()
    {
        require(_token != address(0) && _etherHolder != address(0));
        token = GigToken(_token);

        require(_startTime < _endTime);
        etherHolder = _etherHolder;
        require((_maxTokenSupply == uint256(0)) || (_maxTokenSupply <= token.maxSupply()));

        startTime = _startTime;
        endTime = _endTime;
        maxTokenSupply = _maxTokenSupply;
        etherPriceInUSD = _etherPriceInUSD;

        priceUpdateAt = block.timestamp;
    }

    function setTokenContract(address _token) public onlyOwner {
        require(_token != address(0));
        token = GigToken(_token);
    }

    function setAllocationContract(address _allocation) public onlyOwner {
        require(_allocation != address(0));
        allocation = GigAllocation(_allocation);
    }


    function setEtherHolder(address _etherHolder) public onlyOwner {
        if (_etherHolder != address(0)) {
            etherHolder = _etherHolder;
        }
    }

    function setPurchaseLimits(uint256 _min, uint256 _max) public onlyOwner {
        if (_min < _max) {
            minPurchase = _min;
            maxPurchase = _max;
        }
    }

    function mint(address _address, uint256 _tokenAmount) public onlyOwner returns (uint256) {
        return mintInternal(_address, _tokenAmount);
    }

    function isActive() public view returns (bool);

    function isTransferAllowed(address _from, uint256 _value) public view returns (bool);

    function withinPeriod() public view returns (bool);

    function getMinEthersInvestment() public view returns (uint256) {
        return uint256(1 ether).mul(minPurchase).div(etherPriceInUSD);
    }

    function calculateTokensAmount(uint256 _value) public view returns (uint256 tokenAmount, uint256 usdAmount);

    function calculateEthersAmount(uint256 _tokens) public view returns (uint256 ethers, uint256 bonus);

    function updatePreICOMaxTokenSupply(uint256 _amount) public;

    // set ether price in USD with 5 digits after the decimal point
    //ex. 308.75000
    //for updating the price through  multivest
    function setEtherInUSD(string _price) public onlyAllowedMultivests(msg.sender) {
        bytes memory bytePrice = bytes(_price);
        uint256 dot = bytePrice.length.sub(uint256(6));

        // check if dot is in 6 position  from  the last
        require(0x2e == uint(bytePrice[dot]));

        uint256 newPrice = uint256(10 ** 23).div(parseInt(_price, 5));

        require(newPrice > 0);

        etherPriceInUSD = parseInt(_price, 5);

        priceUpdateAt = block.timestamp;

        NewPriceTicker(_price);
    }

    function mintInternal(address _address, uint256 _tokenAmount) internal returns (uint256) {
        uint256 mintedAmount = token.mint(_address, _tokenAmount);

        require(mintedAmount == _tokenAmount);

        soldTokens = soldTokens.add(_tokenAmount);
        if (maxTokenSupply > 0) {
            require(maxTokenSupply >= soldTokens);
        }

        return _tokenAmount;
    }

    function transferEthers() internal;

    function parseInt(string _a, uint _b) internal pure returns (uint) {
        bytes memory bresult = bytes(_a);
        uint res = 0;
        bool decimals = false;
        for (uint i = 0; i < bresult.length; i++) {
            if ((bresult[i] >= 48) && (bresult[i] <= 57)) {
                if (decimals) {
                    if (_b == 0) break;
                    else _b--;
                }
                res *= 10;
                res += uint(bresult[i]) - 48;
            } else if (bresult[i] == 46) decimals = true;
        }
        if (_b > 0) res *= 10 ** _b;
        return res;
    }
}