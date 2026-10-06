// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IExecutionAdapter} from "../interfaces/IExecutionAdapter.sol";
import {EquencyAssetRegistry} from "../EquencyAssetRegistry.sol";

/// @dev Test/testnet execution bridge. Prices swaps off the registry oracle and fills from
/// its own reserves (pre-funded in tests). Real on mainnet is a DEX-router adapter behind
/// the same IExecutionAdapter interface — the vault/core never changes. NOT for mainnet.
contract MockDexAdapter is IExecutionAdapter {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdg;
    EquencyAssetRegistry public immutable registry;
    uint256 public constant FEE_BPS = 30; // 0.30% realistic swap friction

    constructor(IERC20 usdg_, EquencyAssetRegistry registry_) {
        usdg = usdg_;
        registry = registry_;
    }

    function invest(address assetOut, uint256 usdgIn) external returns (uint256 amountOut) {
        EquencyAssetRegistry.Asset memory a = registry.getAsset(assetOut);
        require(a.oracle != address(0), "no oracle");
        (uint256 price6,) = IPriceOracleLite(a.oracle).priceInUsdg(assetOut);
        // asset amount = usdgIn(6dp) * 10^dec / price6, minus fee
        amountOut = (usdgIn * (10 ** a.decimals)) / price6;
        amountOut = (amountOut * (10_000 - FEE_BPS)) / 10_000;
        IERC20(assetOut).safeTransfer(msg.sender, amountOut); // back to the vault
    }

    function divest(address asset, uint256 amountIn) external returns (uint256 usdgOut) {
        (uint256 value6,) = registry.valueInUsdg(asset, amountIn);
        usdgOut = (value6 * (10_000 - FEE_BPS)) / 10_000;
        usdg.safeTransfer(msg.sender, usdgOut); // back to the vault
    }
}

interface IPriceOracleLite {
    function priceInUsdg(address asset) external view returns (uint256 price6, uint256 updatedAt);
}
