pragma solidity 0.4.18;

import "./../node_modules/zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";


contract TokenERC20 is ERC20 {
    using SafeMath for uint;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public initialSupply;
    uint256 totalSupply_;
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) internal allowed;

    event Approval(address indexed owner, address indexed spender, uint256 value);

    function TokenERC20(string _name, string _symbol, uint8 _decimals, uint256 _initialSupply) public {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        initialSupply = _initialSupply;

        setBalance(msg.sender, initialSupply);
        Transfer(0, msg.sender, initialSupply);
    }

    function totalSupply() public view returns (uint256) {
        return totalSupply_;
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));
        require(_value <= balances[msg.sender]);

        // SafeMath.sub will throw if there is not enough balance.
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256) {
        return allowed[_owner][_spender];
    }

    function setBalance(address holder, uint256 amount) internal {
        balances[holder] = amount;
    }
}
