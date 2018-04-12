pragma solidity 0.4.21;

import "./Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./GigToken.sol";
import "./CrowdSale.sol";


contract GigAllocation is Ownable {

    using SafeMath for uint256;
    uint256 public constant DECIMALS = 18;

    uint256 public remainingTokens;
    bool public ecosystemIncentiveSent;
    bool public marketingBountySent;
    bool public liquidityFundSent;
    bool public treasurySent;
    address public ecosystemIncentive;
    address public marketingBounty;
    address public liquidityFund;
    address public treasury;

    mapping(address => uint256) public advisorsBalances;
    mapping(address => uint256) public teamBalances;

    AdvisorsAllocation[] public allocations;

    TeamsAllocation[] public team;

    GigToken public token;

    CrowdSale public ico;

    //status - 0 new
    //status - 1 sent
    //status - 2 removed

    struct AdvisorsAllocation {
        address holderAddress;
        uint256 amount;
        uint8 status;
    }

    struct TeamsAllocation {
        address holderAddress;
        uint256 amount;
        uint8 status;
    }

    function GigAllocation(
        address _token,
        address _ico,
        uint256 _remainingTokens, //150000000000000000000000000
        address _ecosystemIncentive,
        address _marketingBounty,
        address _liquidityFund,
        address _treasury
    ) public {
        require(_token != address(0) && _ico != address(0));
        token = GigToken(_token);
        ico = CrowdSale(_ico);
        remainingTokens = _remainingTokens;
        ecosystemIncentive = _ecosystemIncentive;
        marketingBounty = _marketingBounty;
        liquidityFund = _liquidityFund;
        treasury = _treasury;

    }

    function setGigToken(address _token) public onlyOwner {
        require(_token != address(0));
        token = GigToken(_token);
    }

    function setICO(address _ico) public onlyOwner {
        require(_ico != address(0));
        ico = CrowdSale(_ico);
    }

    function removeAdvisorsTier(uint256 _id) public onlyOwner {
        if (allocations[_id].status == 1) {
            return;
        }
        AdvisorsAllocation storage allocation = allocations[_id];
        allocation.status = 2;
        remainingTokens = remainingTokens.add(allocation.amount);
    }

    function removeTeamTier(uint256 _id) public onlyOwner {
        if (team[_id].status == 1) {
            return;
        }
        TeamsAllocation storage teamConfig = team[_id];
        teamConfig.status = 2;
        remainingTokens = remainingTokens.add(teamConfig.amount);
    }

    function burnAdviserOrTeamMemberTokens(address _holder) public onlyOwner {
        uint256 amount = advisorsBalances[_holder].add(teamBalances[_holder]);
        if (amount <= token.balanceOf(_holder)) {
            if (amount > 0) {
                require(amount == token.burnInvestorTokens(_holder, amount));
                remainingTokens = remainingTokens.add(amount);
                advisorsBalances[_holder] = 0;
                teamBalances[_holder] = 0;
            }
        }

    }

    function sendEcosystemIncentiveTokens() public onlyOwner {
        if (false == ecosystemIncentiveSent) {
            require(uint256(200000000).mul(10 ** DECIMALS) == token.mint(ecosystemIncentive, uint256(200000000).mul(10 ** DECIMALS)));
            ecosystemIncentiveSent = true;
        }
    }

    function sendMarketingBountyTokens() public onlyOwner {
        if (false == marketingBountySent) {
            require(uint256(50000000).mul(10 ** DECIMALS) == token.mint(marketingBounty, uint256(50000000).mul(10 ** DECIMALS)));
            marketingBountySent = true;
        }
    }

    function sendLiquidityFundTokens() public onlyOwner {
        if (false == liquidityFundSent) {
            require(uint256(50000000).mul(10 ** DECIMALS) == token.mint(liquidityFund, uint256(50000000).mul(10 ** DECIMALS)));
            liquidityFundSent = true;
        }
    }

    function sendTreasuryTokens() public onlyOwner {
        if (false == treasurySent) {
            require(uint256(200000000).mul(10 ** DECIMALS) == token.mint(treasury, uint256(200000000).mul(10 ** DECIMALS)));
            treasurySent = true;
        }
    }

    function setAllocation(uint256 _amount, address[] _addresses) public onlyOwner returns (bool) {
        require(remainingTokens > 0 && _amount > 0 && _addresses.length >= 1);
        require(_amount.mul(uint256(_addresses.length)) <= remainingTokens);

        for (uint8 i = 0; i < _addresses.length; i++) {
            require(_addresses[i] != address(0));
            allocations.push(AdvisorsAllocation(_addresses[i], _amount, 0));
            remainingTokens = remainingTokens.sub(_amount);
        }
        return true;
    }

    function setTeamAllocation(uint256 _amount, address[] _addresses) public onlyOwner returns (bool) {
        require(remainingTokens > 0 && _amount > 0 && _addresses.length >= 1);
        require(_amount.mul(uint256(_addresses.length)) <= remainingTokens);

        for (uint8 i = 0; i < _addresses.length; i++) {
            require(_addresses[i] != address(0));
            team.push(TeamsAllocation(_addresses[i], _amount, 0));
            remainingTokens = remainingTokens.sub(_amount);
        }

        return true;
    }

    function allocate() public onlyOwner {
        allocateAdvisors();
        allocateTeam();
    }

    function isTransferAllowed(address _from, uint256 _value) public view returns (bool status){
        uint256 lockedBalance = advisorsBalances[_from];
        if (ico.endTime().add(1 years) <= block.timestamp && lockedBalance > 0) {
            if (ico.endTime().add(2 years) <= block.timestamp) {
                lockedBalance = 0;
            }
            lockedBalance = advisorsBalances[_from].div(2);
        }
        if (teamBalances[_from] > 0 && ico.endTime().add(3 years) > block.timestamp) {
            lockedBalance = lockedBalance.add(teamBalances[_from]);
            if (ico.endTime().add(1 years) <= block.timestamp) {
                lockedBalance = lockedBalance.sub(teamBalances[_from].div(3));
            } else if (ico.endTime().add(2 years) <= block.timestamp) {
                lockedBalance = lockedBalance.sub(teamBalances[_from].mul(2).div(3));
            }

        }
        if (token.balanceOf(_from) - lockedBalance >= _value) {
            return true;
        }
        return false;
    }

    function allocateAdvisors() internal {
        for (uint256 i = 0; i < allocations.length; i++) {
            if (0 != allocations[i].status) {
                continue;
            }
            AdvisorsAllocation storage allocation = allocations[i];
            allocation.status = 1;

            require(allocation.amount == token.mint(allocation.holderAddress, allocation.amount));
            advisorsBalances[allocation.holderAddress] = advisorsBalances[allocation.holderAddress].add(allocation.amount);
        }
    }

    function allocateTeam() internal {
        for (uint256 i = 0; i < team.length; i++) {

            if (0 != team[i].status) {
                continue;
            }
            TeamsAllocation storage teamConfig = team[i];
            teamConfig.status = 1;

            require(teamConfig.amount == token.mint(teamConfig.holderAddress, teamConfig.amount));
            teamBalances[teamConfig.holderAddress] = teamBalances[teamConfig.holderAddress].add(teamConfig.amount);
        }
    }


}
