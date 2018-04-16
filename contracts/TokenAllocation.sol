pragma solidity 0.4.19;

import "./PeriodicTokenVesting.sol";
import "./MintingERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
/*
    Tests:
    - check that initVesting could be called only once
    - check that after creation all balances (owners, funds, team) are null
    - check that after creation & initVesting all balances (owners, funds, team) are null
    - check that after creation & initVesting, allocate - all balances are filled (owners, funds, team)
    - check that after creation & initVesting, allocate - subsequent calls of `allocate` should fail
    - check that created vesting has correctly inited variables (equal what was send to createVesting)
    - check that METHODS could be called only by owner
        - initVesting
        - createVesting
        - revokeVesting
*/

contract TokenAllocation is Ownable {
    using SafeERC20 for ERC20Basic;
    using SafeMath for uint256;

    address public ecosystemIncentive = 0xd339D9aeDFFa244E09874D65290c09d64b2356E0;
    address public marketingAndBounty = 0x26d6EF95A51BF0A2048Def4Fb7c548c3BDE37410;
    address public liquidityFund = 0x3D458b6f9024CDD9A2a7528c2E6451DD3b29e4cc;
    address public treasure = 0x00dEaFC5959Dd0E164bB00D06B08d972A276bf8E;
    address public amirShaikh = 0x31b17e7a2F86d878429C03f3916d17555C0d4884;
    address public sadiqHameed = 0x27B5cb71ff083Bd6a34764fBf82700b3669137f3;
    address public omairLatif = 0x92Db818bF10Bf3BfB73942bbB1f184274aA63833;

    uint256 public icoEndTime;

    address public vestingApplicature;
    address public vestingSimonCocking;
    address public vestingNathanChristian;
    address public vestingEdwinVanBerg;

    mapping (address => bool) tokenInited;
    mapping (address => bool) vestings;

    event VestingCreated(
        address _vesting,
        address _beneficiary,
        uint256 _start,
        uint256 _cliff,
        uint256 _duration,
        uint256 _periods,
        bool _revocable
    );

    event VestingRevoked(address _vesting);

    function setICOEndTime(uint256 _icoEndTime) public onlyOwner{
        icoEndTime = _icoEndTime;
    }

    function initVesting() public onlyOwner() {
        require(vestingApplicature == address(0) &&
                vestingSimonCocking == address(0) &&
                vestingNathanChristian == address(0) &&
                vestingEdwinVanBerg == address(0));

        uint256 oneYearAfterIcoEnd = icoEndTime.add(1 years);

        vestingApplicature = createVesting(address(0), oneYearAfterIcoEnd, 0, 1 years, 2, false);

        vestingSimonCocking = createVesting(
            0x7f438d78a51886B24752941ba98Cc00aBA217495, oneYearAfterIcoEnd, 0, 1 years, 2, true
        );

        vestingNathanChristian = createVesting(
            0xfD86B8B016de558Fe39B1697cBf525592A233B2c, oneYearAfterIcoEnd, 0, 1 years, 2, true
        );

        vestingEdwinVanBerg = createVesting(
            0x2451A73F35874028217bC833462CCd90c72dbE6D, oneYearAfterIcoEnd, 0, 1 years, 2, true
        );
    }

    function allocate(MintingERC20 token) public onlyOwner() {
        require(tokenInited[token] == false);

        tokenInited[token] = true;

        require(vestingApplicature != address(0));
        require(vestingSimonCocking != address(0));
        require(vestingNathanChristian != address(0));
        require(vestingEdwinVanBerg != address(0));

        uint256 tokenPrecision = uint256(10) ** uint256(token.decimals());

        // allocate funds
        token.mint(ecosystemIncentive, 200000000 * tokenPrecision);
        token.mint(marketingAndBounty, 50000000 * tokenPrecision);
        token.mint(liquidityFund, 50000000	* tokenPrecision);
        token.mint(treasure, 200000000 * tokenPrecision);

        // allocate funds to founders
        token.mint(amirShaikh, 73350000 * tokenPrecision);
        token.mint(sadiqHameed, 36675000 * tokenPrecision);
        token.mint(amirShaikh, 36675000 * tokenPrecision);

        // allocate funds to advisors
        token.mint(vestingApplicature, 1500000 * tokenPrecision);
        token.mint(vestingSimonCocking, 750000 * tokenPrecision);
        token.mint(vestingNathanChristian, 750000 * tokenPrecision);
        token.mint(vestingEdwinVanBerg, 300000 * tokenPrecision);
    }

    function createVesting(
        address _beneficiary, uint256 _start, uint256 _cliff, uint256 _duration, uint256 _periods, bool _revocable
    ) public onlyOwner() returns (PeriodicTokenVesting) {
        PeriodicTokenVesting vesting = new PeriodicTokenVesting(
            _beneficiary, _start, _cliff, _duration, _periods, _revocable
        );

        vestings[vesting] = true;

        VestingCreated(vesting, _beneficiary, _start, _cliff, _duration, _periods, _revocable);

        return vesting;
    }

    function revokeVesting(PeriodicTokenVesting _vesting, MintingERC20 token) public onlyOwner() {
        _vesting.revoke(token);

        VestingRevoked(_vesting);
    }
}
