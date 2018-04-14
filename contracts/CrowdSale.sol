pragma solidity 0.4.19;

import "./SellableToken.sol";


contract CrowdSale is SellableToken {
    uint8 public constant PRE_ICO_TIER_FIRST = 0;
    uint8 public constant PRE_ICO_TIER_LAST = 4;
    uint8 public constant ICO_TIER_FIRST = 5;
    uint8 public constant ICO_TIER_LAST = 12;
    uint8 public constant LOCK_BALANCES_TO = 3;

    SellableToken public privateSale;

    uint256 public price;

    Stats public preICOStats;
    mapping(address => uint256) public icoBalances;

    struct Stats {
        uint256 soldTokens;
        uint256 collectedUSD;
        uint256 collectedEthers;
        bool burned;
    }

    function CrowdSale(
        address _token,
        address _etherHolder,
        uint256 _maxTokenSupply,
        uint256 _price,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _etherPriceInUSD
    ) public
    SellableToken(
        _token,
        _etherHolder,
        _startTime,
        _endTime,
        _maxTokenSupply,
        _etherPriceInUSD
    ) {
        softCap = 500000000000;
        hardCap = 5010477900000;
        price = _price;
        //0.2480* 10^5
        //PreICO
        tiers.push(
            Tier(
                uint256(65),
                _startTime,
                _startTime.add(1 hours)
            )
        );
        tiers.push(
            Tier(
                uint256(60),
                _startTime.add(1 hours),
                _startTime.add(1 days)
            )
        );
        tiers.push(
            Tier(
                uint256(57),
                _startTime.add(1 days),
                _startTime.add(2 days)
            )
        );
        tiers.push(
            Tier(
                uint256(55),
                _startTime.add(2 days),
                _startTime.add(3 days)
            )
        );
        tiers.push(
            Tier(
                uint256(50),
                _startTime.add(3 days),
                _startTime.add(30 days)
            )
        );
        //ICO
        tiers.push(
            Tier(
                uint256(25),
                _startTime.add(30 days),
                _startTime.add(30 days).add(1 weeks)
            )
        );
        tiers.push(
            Tier(
                uint256(15),
                _startTime.add(30 days).add(1 weeks),
                _startTime.add(30 days).add(2 weeks)
            )
        );
        tiers.push(
            Tier(
                uint256(10),
                _startTime.add(30 days).add(2 weeks),
                _startTime.add(30 days).add(3 weeks)
            )
        );
        tiers.push(
            Tier(
                uint256(6),
                _startTime.add(30 days).add(3 weeks),
                _startTime.add(30 days).add(4 weeks)
            )
        );
        tiers.push(
            Tier(
                uint256(4),
                _startTime.add(30 days).add(4 weeks),
                _startTime.add(30 days).add(5 weeks)
            )
        );
        tiers.push(
            Tier(
                uint256(2),
                _startTime.add(30 days).add(5 weeks),
                _startTime.add(30 days).add(6 weeks)
            )
        );
        tiers.push(
            Tier(
                uint256(0),
                _startTime.add(30 days).add(6 weeks),
                _startTime.add(30 days).add(7 weeks)
            )
        );
        tiers.push(
            Tier(
                uint256(0),
                _startTime.add(30 days).add(7 weeks),
                _endTime
            )
        );
    }

    function changeICODates(uint8 _tierId, uint256 _start, uint256 _end) public onlyOwner {
        require(_start != 0 && _start < _end && _tierId < tiers.length);
        Tier storage icoTier = tiers[_tierId];
        icoTier.startTime = _start;
        icoTier.endTime = _end;
        if (_tierId == PRE_ICO_TIER_FIRST) {
            startTime = _start;
        } else if (_tierId == ICO_TIER_LAST) {
            endTime = _end;
        }
    }

    function isActive() public view returns (bool) {
        if (hardCap == collectedUSD) {
            return false;
        }
        if (soldTokens == maxTokenSupply) {
            return false;
        }

        return withinPeriod();
    }

    function withinPeriod() public view returns (bool) {
        return getActiveTier() != tiers.length;
    }

    function setPrivateSale(address _privateSale) public onlyOwner {
        if (_privateSale != address(0)) {
            privateSale = SellableToken(_privateSale);
        }
    }

    function getActiveTier() public view returns (uint8) {
        for (uint8 i = 0; i < tiers.length; i++) {
            if (block.timestamp >= tiers[i].startTime && block.timestamp <= tiers[i].endTime) {
                return i;
            }
        }

        return uint8(tiers.length);
    }

    function calculateTokensAmount(uint256 _value) public view returns (uint256 tokenAmount, uint256 usdAmount) {
        if (_value == 0) {
            return (0, 0);
        }
        uint8 activeTier = getActiveTier();

        if (activeTier == tiers.length) {
            if (endTime < block.timestamp) {
                return (0, 0);
            }
            if (startTime > block.timestamp) {
                activeTier = PRE_ICO_TIER_FIRST;
            }
        }
        usdAmount = _value.mul(etherPriceInUSD);

        tokenAmount = usdAmount.div(price * (100 - tiers[activeTier].discount) / 100);

        usdAmount = usdAmount.div(uint256(10) ** 18);

        if (usdAmount < minPurchase) {
            return (0, 0);
        }
    }

    function calculateEthersAmount(uint256 _tokens) public view returns (uint256 ethers, uint256 discount) {
        if (_tokens == 0 ) {
            return (0, 0);
        }

        uint8 activeTier = getActiveTier();

        if (activeTier == tiers.length) {
            if (endTime < block.timestamp) {
                return (0, 0);
            }
            if (startTime > block.timestamp) {
                activeTier = PRE_ICO_TIER_FIRST;
            }
        }

        ethers = _tokens.mul(price).div(etherPriceInUSD);

        if( ethers < getMinEthersInvestment()){
            return (0, 0);
        }

        uint256 usdAmount = ethers.mul(etherPriceInUSD);

        discount = usdAmount.div(price * (100 - tiers[activeTier].discount) / 100) - _tokens;
    }

    function getStats(uint256 _ethPerBtc) public view returns (
        uint256 sold,
        uint256 maxSupply,
        uint256 min,
        uint256 soft,
        uint256 hard,
        uint256 tokenPrice,
        uint256 tokensPerEth,
        uint256 tokensPerBtc,
        uint256[39] tiersData
    ) {
        sold = soldTokens;
        maxSupply = maxTokenSupply;
        min = minPurchase;
        soft = softCap;
        hard = hardCap;
        tokenPrice = price;
        uint256 usd;
        (tokensPerEth, usd) = calculateTokensAmount(1 ether);
        (tokensPerBtc, usd) = calculateTokensAmount(_ethPerBtc);
        uint256 j = 0;
        for (uint256 i = 0; i < tiers.length; i++) {
            tiersData[j++] = uint256(tiers[i].discount);
            tiersData[j++] = uint256(tiers[i].startTime);
            tiersData[j++] = uint256(tiers[i].endTime);
        }
    }

    function burnUnsoldTokens() public onlyOwner {
        if (block.timestamp >= endTime && maxTokenSupply > soldTokens) {
            token.burnUnsoldTokens(maxTokenSupply.sub(soldTokens));
            maxTokenSupply = soldTokens;
        }
    }

    function isTransferAllowed(address _from, uint256 _value) public view returns (bool status){
        uint8 activeTier = getActiveTier();
        if (activeTier >= PRE_ICO_TIER_FIRST && activeTier <= PRE_ICO_TIER_LAST) {
            return true;
        }
        if (collectedUSD < softCap) {
            if (token.balanceOf(_from) - icoBalances[_from] > _value) {
                return true;
            }
            return false;
        }
        return true;
    }

    function isRefundPossible() public view returns (bool) {
        if (isActive() || block.timestamp < startTime || collectedUSD >= softCap) {
            return false;
        }
        return true;
    }

    function refund() public returns (bool) {
        if (!isRefundPossible() || etherBalances[msg.sender] == 0) {
            return false;
        }

        uint256 burnedAmount = token.burnInvestorTokens(msg.sender, icoBalances[msg.sender]);
        if (burnedAmount == 0) {
            return false;
        }

        etherBalances[msg.sender] = 0;

        msg.sender.transfer(etherBalances[msg.sender]);

        Refund(msg.sender, etherBalances[msg.sender], burnedAmount);

        return true;
    }

    function setMaxTokenSupply(uint256 _amount) public {
        if (msg.sender == address(privateSale)) {
            maxTokenSupply = _amount;
        }
    }

    function transferEthers() internal {
        if (collectedUSD >= softCap) {
            etherHolder.transfer(this.balance);
        }
    }

    function mintPreICO(
        address _address,
        uint256 _tokenAmount,
        uint256 _ethAmount,
        uint256 _usdAmount
    ) internal returns (uint256) {
        uint256 mintedAmount = token.mint(_address, _tokenAmount);

        require(mintedAmount == _tokenAmount);

        preICOStats.soldTokens = preICOStats.soldTokens.add(_tokenAmount);
        preICOStats.collectedEthers = preICOStats.collectedEthers.add(_ethAmount);
        preICOStats.collectedUSD = preICOStats.collectedUSD.add(_usdAmount);

        require(maxTokenSupply >= preICOStats.soldTokens);

        return _tokenAmount;
    }

    function buy(address _address, uint256 _value) internal returns (bool) {
        if (_value == 0 || _address == address(0)) {
            return false;
        }

        uint8 activeTier = getActiveTier();
        if (activeTier == tiers.length) {
            return false;
        }

        uint256 tokenAmount;
        uint256 usdAmount;
        uint256 mintedAmount;

        (tokenAmount, usdAmount) = calculateTokensAmount(_value);

        if (activeTier >= PRE_ICO_TIER_FIRST && activeTier <= PRE_ICO_TIER_LAST) {
            if (address(allocation) == address(0)) {
                return false;
            }
            mintedAmount = mintPreICO(_address, tokenAmount, _value, usdAmount);

            require(usdAmount > 0 && mintedAmount > 0);
            if (activeTier <= LOCK_BALANCES_TO) {
                allocation.allocateToken(_address, _value, MONTH_IN_SEC, 1 years);
            }
            etherHolder.transfer(this.balance);
        } else {
            mintedAmount = mintInternal(_address, tokenAmount);
            collectedUSD = collectedUSD.add(usdAmount);
            require(hardCap >= collectedUSD && usdAmount > 0 && mintedAmount > 0);

            transferEthers();
            collectedEthers = collectedEthers.add(_value);
            etherBalances[_address] = etherBalances[_address].add(_value);
            icoBalances[_address] = icoBalances[_address].add(tokenAmount);
        }

        Contribution(_address, _value, tokenAmount);

        return true;
    }
}
