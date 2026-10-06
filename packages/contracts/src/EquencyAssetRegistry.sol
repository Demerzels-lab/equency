// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

/// @title EquencyAssetRegistry
/// @notice The single source of truth for which tokens a vault may ever hold or trade
/// (brief §49, §73 — "never trust arbitrary token addresses"). The AI/strategy layer can
/// only reference assets that an owner has verified here; a vault rejects everything else.
contract EquencyAssetRegistry is Ownable {
    struct Asset {
        bool enabled;
        uint8 decimals;
        address oracle; // IPriceOracle giving price in USDG (6dp)
        string symbol;
    }

    mapping(address => Asset) private _assets;
    address[] public listed;

    event AssetSet(address indexed token, bool enabled, uint8 decimals, address oracle, string symbol);

    constructor(address owner_) Ownable(owner_) {}

    function setAsset(address token, bool enabled, uint8 decimals_, address oracle, string calldata symbol)
        external
        onlyOwner
    {
        require(token != address(0), "token=0");
        if (_assets[token].oracle == address(0) && oracle != address(0)) listed.push(token);
        _assets[token] = Asset(enabled, decimals_, oracle, symbol);
        emit AssetSet(token, enabled, decimals_, oracle, symbol);
    }

    function isSupported(address token) external view returns (bool) {
        return _assets[token].enabled;
    }

    function getAsset(address token) external view returns (Asset memory) {
        return _assets[token];
    }

    /// @notice Value of `amount` of `token` in USDG base units (6dp), with the oracle's
    /// freshness timestamp so callers can reject stale prices (brief §50).
    function valueInUsdg(address token, uint256 amount) external view returns (uint256 value6, uint256 updatedAt) {
        Asset memory a = _assets[token];
        require(a.oracle != address(0), "no oracle");
        uint256 price6;
        (price6, updatedAt) = IPriceOracle(a.oracle).priceInUsdg(token);
        value6 = (amount * price6) / (10 ** a.decimals);
    }

    function listedCount() external view returns (uint256) {
        return listed.length;
    }
}
