// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Price of one whole `asset` denominated in USDG base units (6 decimals).
/// e.g. a $42.18 stock token returns price = 42_180000.
interface IPriceOracle {
    function priceInUsdg(address asset) external view returns (uint256 price6, uint256 updatedAt);
}
