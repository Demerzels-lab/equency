// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPriceOracle} from "../interfaces/IPriceOracle.sol";

/// @dev Owner-set price oracle for testnet/tests. On mainnet this is replaced by a
/// Chainlink-backed adapter (brief §51 — "oracle TODO" documented, owner-set here).
contract MockOracle is IPriceOracle, Ownable {
    struct Px {
        uint256 price6;
        uint256 updatedAt;
    }

    mapping(address => Px) private _px;

    constructor(address owner_) Ownable(owner_) {}

    function setPrice(address asset, uint256 price6) external onlyOwner {
        _px[asset] = Px(price6, block.timestamp);
    }

    function priceInUsdg(address asset) external view returns (uint256 price6, uint256 updatedAt) {
        Px memory p = _px[asset];
        require(p.price6 > 0, "no price");
        return (p.price6, p.updatedAt);
    }
}
