// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import {EquencyAssetRegistry} from "../src/EquencyAssetRegistry.sol";
import {EquencyVaultFactory} from "../src/EquencyVaultFactory.sol";
import {ChainlinkPriceAdapter} from "../src/ChainlinkPriceAdapter.sol";
import {IExecutionAdapter} from "../src/interfaces/IExecutionAdapter.sol";

/// Mainnet (4663) deploy — uses the REAL canonical USDG + Robinhood stock tokens (verified
/// on-chain). This is the honest, SAFE launch: it deploys the custody layer only.
///   - Oracle = ChainlinkPriceAdapter, deployed with NO feeds set (prices revert until an
///     owner wires a verified Chainlink feed per asset — feed addresses are NOT yet confirmed
///     on Robinhood Chain, so stock tokens are registered DISABLED).
///   - Execution adapter = address(0): vaults can custody/deposit/withdraw REAL USDG, but
///     allocate() reverts until a verified DEX-router adapter is integrated + reviewed.
///   - User vaults ship PAUSED + capped. No real deposits until a deliberate unpause after audit.
///
/// Dry-run (fork simulation): forge script script/DeployMainnet.s.sol --rpc-url robinhood_mainnet
/// Broadcast (SEPARATE human authorization): add --broadcast --account <deployer> --sender <addr>
contract DeployMainnet is Script {
    // Verified on-chain 2026-10-06.
    address constant USDG = 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168; // Global Dollar, 6dp
    address constant TSLA = 0x322F0929c4625eD5bAd873c95208D54E1c003b2d; // 18dp
    address constant NVDA = 0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC; // 18dp

    function run() external {
        require(block.chainid == 4663, "not Robinhood mainnet");
        address deployer = msg.sender;
        console.log("Deployer:", deployer);
        console.log("Balance (wei):", deployer.balance);

        // Sanity-check the real token before building on it (web3-ship §1).
        require(IERC20Metadata(USDG).decimals() == 6, "USDG not 6dp");

        vm.startBroadcast();

        EquencyAssetRegistry registry = new EquencyAssetRegistry(deployer);
        ChainlinkPriceAdapter oracle = new ChainlinkPriceAdapter(deployer);

        // Register the real stock tokens as KNOWN but DISABLED (enabled=false) until their
        // Chainlink feeds are confirmed on-chain and wired via oracle.setFeed(...).
        registry.setAsset(TSLA, false, 18, address(oracle), "TSLA");
        registry.setAsset(NVDA, false, 18, address(oracle), "NVDA");

        // No DEX execution route yet — custody-only launch.
        EquencyVaultFactory factory =
            new EquencyVaultFactory(IERC20(USDG), registry, IExecutionAdapter(address(0)), deployer);

        vm.stopBroadcast();

        console.log("USDG (real):   ", USDG);
        console.log("Registry:      ", address(registry));
        console.log("Oracle(CL):    ", address(oracle));
        console.log("VaultFactory:  ", address(factory));
        console.log("Adapter:        0x0 (no DEX route yet)");

        string memory o = "equency";
        vm.serializeUint(o, "chainId", block.chainid);
        vm.serializeAddress(o, "USDG", USDG);
        vm.serializeAddress(o, "TSLA", TSLA);
        vm.serializeAddress(o, "NVDA", NVDA);
        vm.serializeAddress(o, "Oracle", address(oracle));
        vm.serializeAddress(o, "Adapter", address(0));
        vm.serializeAddress(o, "Registry", address(registry));
        string memory json = vm.serializeAddress(o, "VaultFactory", address(factory));
        vm.writeJson(json, "./deployments/4663-vault.json");
        console.log("Wrote ./deployments/4663-vault.json");
    }
}
