// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {EquencyAssetRegistry} from "../src/EquencyAssetRegistry.sol";
import {EquencyStrategyVault} from "../src/EquencyStrategyVault.sol";
import {IExecutionAdapter} from "../src/interfaces/IExecutionAdapter.sol";

/// Real-integration test (web3-ship §5): runs the vault against the ACTUAL canonical USDG
/// on a Robinhood Chain mainnet fork — "N passed on a mock proves nothing about the real
/// token". Requires RH_RPC_MAINNET; skips cleanly if it is not set.
contract ForkUSDGTest is Test {
    // Verified on-chain 2026-10-06.
    address constant USDG = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168;
    address constant USDG_HOLDER = 0xaE41c3cDacd271B9D152e4dF07b7Cf950DCdC17C; // held ~407 USDG
    uint256 constant FORK_BLOCK = 81_286_132;

    address user = makeAddr("forkUser");

    function test_VaultCustodiesRealUsdg() public {
        string memory rpc = vm.envOr("RH_RPC_MAINNET", string(""));
        if (bytes(rpc).length == 0) {
            emit log("RH_RPC_MAINNET not set - skipping real-USDG fork test");
            vm.skip(true);
            return;
        }
        vm.createSelectFork(rpc, FORK_BLOCK);

        // 1) Confirm the real token behaves as our brief assumed.
        assertEq(IERC20Metadata(USDG).decimals(), 6, "real USDG is 6dp");
        assertEq(keccak256(bytes(IERC20Metadata(USDG).symbol())), keccak256("USDG"), "symbol USDG");

        // 2) Deploy a vault whose asset IS real USDG (no adapter needed for deposit/withdraw).
        EquencyAssetRegistry registry = new EquencyAssetRegistry(address(this));
        EquencyStrategyVault vault = new EquencyStrategyVault(
            IERC20(USDG), registry, IExecutionAdapter(address(0)), 3000, 2000, 5, 1_000_000e6, user
        );

        // 3) Fund the user with REAL USDG from a known holder.
        uint256 holderBal = IERC20(USDG).balanceOf(USDG_HOLDER);
        require(holderBal >= 10e6, "holder lacks USDG at fork block");
        uint256 amt = 10e6; // 10 USDG
        vm.prank(USDG_HOLDER);
        IERC20(USDG).transfer(user, amt);
        assertEq(IERC20(USDG).balanceOf(user), amt, "user funded with real USDG");

        // 4) Deposit real USDG → shares; NAV reads the real balance.
        vm.startPrank(user);
        vault.unpause();
        IERC20(USDG).approve(address(vault), amt);
        uint256 shares = vault.deposit(amt, user);
        vm.stopPrank();

        assertGt(shares, 0, "shares minted for real USDG");
        assertEq(vault.totalAssets(), amt, "NAV == real USDG deposited");

        // 5) Withdraw real USDG back out.
        vm.prank(user);
        vault.withdraw(4e6, user, user);
        assertEq(IERC20(USDG).balanceOf(user), 4e6, "withdrew real USDG");
        assertEq(vault.totalAssets(), 6e6, "NAV reduced to real remainder");

        emit log("OK: EquencyStrategyVault custodies & accounts REAL USDG on Robinhood Chain fork");
    }
}
