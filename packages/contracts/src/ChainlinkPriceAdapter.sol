// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/// @title ChainlinkPriceAdapter
/// @notice Mainnet oracle for EQUENCY (brief §51). Wraps a Chainlink AggregatorV3 feed per
/// asset and normalises the answer to USDG base units (6 decimals), passing through the
/// feed's own freshness timestamp so the vault can reject stale prices. Ships with NO feeds
/// set — `priceInUsdg` reverts until an owner wires a verified feed, so a price is never
/// fabricated (web3-ship §0). Feed addresses on Robinhood Chain must be confirmed on-chain
/// before enabling the corresponding asset in the registry.
contract ChainlinkPriceAdapter is IPriceOracle, Ownable {
    struct Feed {
        address aggregator;
        uint8 feedDecimals;
    }

    mapping(address => Feed) public feeds;

    event FeedSet(address indexed asset, address indexed aggregator, uint8 feedDecimals);

    constructor(address owner_) Ownable(owner_) {}

    function setFeed(address asset, address aggregator) external onlyOwner {
        uint8 d = AggregatorV3Interface(aggregator).decimals();
        feeds[asset] = Feed(aggregator, d);
        emit FeedSet(asset, aggregator, d);
    }

    function priceInUsdg(address asset) external view returns (uint256 price6, uint256 updatedAt) {
        Feed memory f = feeds[asset];
        require(f.aggregator != address(0), "no feed");
        (, int256 answer,, uint256 ua,) = AggregatorV3Interface(f.aggregator).latestRoundData();
        require(answer > 0, "bad price");
        // normalise feed decimals -> USDG 6dp
        price6 = (uint256(answer) * 1e6) / (10 ** f.feedDecimals);
        updatedAt = ua;
    }
}
