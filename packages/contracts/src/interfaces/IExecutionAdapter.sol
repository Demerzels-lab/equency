// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice Execution bridge behind one interface (web3-ship §3). Approval-free flow:
/// the vault TRANSFERS funds to the adapter first, then calls invest()/divest();
/// the adapter sends the swapped asset back to the vault and returns the realized amount
/// (which may be < requested — honest partial fills are allowed, never a silent lie).
interface IExecutionAdapter {
    /// @dev Vault has already sent `usdgIn` USDG to this adapter. Swap to `assetOut`,
    ///      send it to the vault (msg.sender), return the amount delivered.
    function invest(address assetOut, uint256 usdgIn) external returns (uint256 amountOut);

    /// @dev Vault has already sent `amountIn` of `asset` to this adapter. Swap to USDG,
    ///      send it to the vault (msg.sender), return the USDG delivered.
    function divest(address asset, uint256 amountIn) external returns (uint256 usdgOut);
}
