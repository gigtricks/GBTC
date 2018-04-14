pragma solidity 0.4.19;

import "./Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./GigToken.sol";
import "./CrowdSale.sol";


contract GigAllocation is Ownable {

    using SafeMath for uint256;
    uint256 public constant DECIMALS = 18;

    uint256 public remainingTokens;
    uint256 public unlockTime;
    bool public ecosystemIncentiveSent;
    bool public marketingBountySent;
    bool public liquidityFundSent;
    bool public treasurySent;
    address public ecosystemIncentive;
    address public marketingBounty;
    address public liquidityFund;
    address public treasury;

    GigToken public token;

    struct Allocation {
        uint256 balance; // locked balance to unlock
        uint256 periodDuration; // seconds, e.g. 1 month = 2629743 secs
        uint256 periods; // number of periods, e.g. 12 months for unlocking = 12
    }

    mapping(address => Allocation) public allocations;

    mapping(address => bool) public trustedAddresses;
    mapping(address => uint256) public burnableBalances;

    modifier onlyTrustedAddress(address _address) {
        require(trustedAddresses[_address] == true);
        _;
    }

    function GigAllocation(
        address _token,
        uint256 _icoEndTime,
        uint256 _remainingTokens, //150000000000000000000000000
        address _ecosystemIncentive,
        address _marketingBounty,
        address _liquidityFund,
        address _treasury
    ) public {
        require(_token != address(0));
        token = GigToken(_token);
        remainingTokens = _remainingTokens;
        ecosystemIncentive = _ecosystemIncentive;
        marketingBounty = _marketingBounty;
        liquidityFund = _liquidityFund;
        treasury = _treasury;
        unlockTime = _icoEndTime + 1 years;

    }

    function setGigToken(address _token) public onlyOwner {
        require(_token != address(0));
        token = GigToken(_token);
    }

    function setAllocationWallets(
        address _ecosystemIncentive,
        address _marketingBounty,
        address _liquidityFund,
        address _treasury
    ) public onlyOwner {
        ecosystemIncentive = _ecosystemIncentive;
        marketingBounty = _marketingBounty;
        liquidityFund = _liquidityFund;
        treasury = _treasury;
    }

    function sendEcosystemIncentiveTokens() public onlyOwner {
        if (false == ecosystemIncentiveSent && ecosystemIncentive != address(0)) {
            require(uint256(200000000).mul(10 ** DECIMALS) == token.mint(ecosystemIncentive, uint256(200000000).mul(10 ** DECIMALS)));
            ecosystemIncentiveSent = true;
        }
    }

    function sendMarketingBountyTokens() public onlyOwner {
        if (false == marketingBountySent && marketingBounty != address(0)) {
            require(uint256(50000000).mul(10 ** DECIMALS) == token.mint(marketingBounty, uint256(50000000).mul(10 ** DECIMALS)));
            marketingBountySent = true;
        }
    }

    function sendLiquidityFundTokens() public onlyOwner {
        if (false == liquidityFundSent && liquidityFund != address(0)) {
            require(uint256(50000000).mul(10 ** DECIMALS) == token.mint(liquidityFund, uint256(50000000).mul(10 ** DECIMALS)));
            liquidityFundSent = true;
        }
    }

    function sendTreasuryTokens() public onlyOwner {
        if (false == treasurySent && treasury != address(0)) {
            require(uint256(200000000).mul(10 ** DECIMALS) == token.mint(treasury, uint256(200000000).mul(10 ** DECIMALS)));
            treasurySent = true;
        }
    }

    function updateTrustedAddressStatus(address _address, bool _status) public onlyOwner {
        require(_address != address(0));
        trustedAddresses[_address] = _status;
    }


    // allocate team token
    function allocateTeamToken(address _holderAddress, uint256 _tokens) public onlyOwner {
        require(remainingTokens > 0 && _tokens > 0 && _tokens <= remainingTokens);
        remainingTokens = remainingTokens.sub(_tokens);
        require(_tokens == token.mint(_holderAddress, _tokens));
        internalAllocateToken(_holderAddress, _tokens, 1 years, 3);
        burnableBalances[_holderAddress] = burnableBalances[_holderAddress].add(_tokens);
    }

    // allocate advisors token
    function allocateAdvisorsToken(address _holderAddress, uint256 _tokens) public onlyOwner {
        require(remainingTokens > 0 && _tokens > 0 && _tokens <= remainingTokens);
        remainingTokens = remainingTokens.sub(_tokens);
        require(_tokens == token.mint(_holderAddress, _tokens));
        internalAllocateToken(_holderAddress, _tokens, 1 years, 2);
        burnableBalances[_holderAddress] = burnableBalances[_holderAddress].add(_tokens);
    }

    // only team's or advisor's tokens can be burned
    function burnAllocatedTokens(address _holderAddress) public onlyOwner returns (bool){
        uint256 amount = burnableBalances[_holderAddress];
        if (amount > 0 && amount <= token.balanceOf(_holderAddress)) {
            require(amount == token.burnInvestorTokens(_holderAddress, amount));
            remainingTokens = remainingTokens.add(amount);
            burnableBalances[_holderAddress] = 0;
            if (allocations[_holderAddress].balance <= amount) {
                delete (allocations[_holderAddress]);
                return true;
            }
            Allocation storage allocation = allocations[_holderAddress];
            allocation.balance = allocation.balance.sub(amount);
        }
    }

    // should be called by private sale & pre ico contracts
    function allocateToken(
        address _holderAddress,
        uint256 _tokens,
        uint256 _periodDuration,
        uint256 _periods
    ) public onlyTrustedAddress(msg.sender) {
        internalAllocateToken(_holderAddress, _tokens, _periodDuration, _periods);
    }

    function isLocked(address _address) public view returns (bool){
        return allocations[_address].balance > 0;
    }

    // should be called by token contract
    function isAllowedToTransfer(address _holderAddress, uint256 _addressBalance, uint256 _tokensToTransfer) public view returns (bool) {
        Allocation memory allocation = allocations[_holderAddress];

        require(block.timestamp > unlockTime);

        // unlockTime = end of ico + 1 year
        uint256 secsFromUnlock = now - unlockTime;

        uint256 tokensPerPeriod = allocation.balance / allocation.periods;

        uint256 periodsEnded = secsFromUnlock / allocation.periodDuration;

        if (periodsEnded >= allocation.periods) {
            return true;
        }

        uint256 lockedBalance = allocation.balance - tokensPerPeriod * periodsEnded;

        if (_addressBalance < lockedBalance || _addressBalance - lockedBalance < _tokensToTransfer) {
            return false;
        }

        return true;
    }

    function internalAllocateToken(address _holderAddress, uint256 _tokens, uint256 _periodDuration, uint256 _periods) internal {
        Allocation storage allocation = allocations[_holderAddress];

        require(_periods == 0 || allocation.periods == _periods);
        require(_periodDuration == 0 || allocation.periodDuration == _periodDuration);

        allocation.periods = _periods;
        allocation.periodDuration = _periodDuration;

        allocation.balance = allocation.balance.add(_tokens);
    }
}
