pragma solidity 0.4.19;


import "zeppelin-solidity/contracts/token/ERC20/TokenVesting.sol";


contract PeriodicTokenVesting is TokenVesting {
    uint256 public periods;

    function PeriodicTokenVesting(
        address _beneficiary, uint256 _start, uint256 _cliff, uint256 _duration, uint256 _periods, bool _revocable
    )
        public TokenVesting(_beneficiary, _start, _cliff, _duration, _revocable)
    {
        periods = _periods;
    }

    /**
    * @dev Calculates the amount that has already vested.
    * @param token ERC20 token which is being vested
    */
    function vestedAmount(ERC20Basic token) public view returns (uint256) {
        uint256 currentBalance = token.balanceOf(this);
        uint256 totalBalance = currentBalance.add(released[token]);

        if (now < cliff) {
            return 0;
        } else if (now >= start.add(duration) || revoked[token]) {
            return totalBalance;
        } else {
            return totalBalance.mul(now.sub(start)).div(periods).div(duration);
        }
    }
}
