// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {EquencyAssetRegistry} from "../src/EquencyAssetRegistry.sol";
import {EquencyVaultFactory} from "../src/EquencyVaultFactory.sol";
import {IExecutionAdapter} from "../src/interfaces/IExecutionAdapter.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {MockDexAdapter} from "../src/mocks/MockDexAdapter.sol";

/// Testnet (46630) deploy. The canonical USDG + stock tokens do NOT exist on testnet, so we
/// deploy a MOCK stack to exercise the real vault/registry/policy/adapter wiring. On mainnet
/// a separate script wires the REAL USDG (0x5fc5…1d168) + a Chainlink oracle + a DEX adapter.
///
/// Dry-run (read-only simulation):  forge script script/Deploy.s.sol --rpc-url robinhood_testnet
/// Broadcast (needs funded key):    add  --broadcast --private-key $DEPLOYER_PRIVATE_KEY
contract Deploy is Script {
    function run() external {
        address deployer = msg.sender;
        console.log("Deployer:", deployer);
        console.log("Balance (wei):", deployer.balance);

        vm.startBroadcast();

        // Mock assets (testnet only)
        MockERC20 usdg = new MockERC20("USD Global (test)", "USDG", 6);
        MockERC20 tsla = new MockERC20("Tesla RH Token (test)", "TSLA", 18);
        MockERC20 nvda = new MockERC20("NVIDIA RH Token (test)", "NVDA", 18);

        // Oracle + prices (owner-set on testnet)
        MockOracle oracle = new MockOracle(deployer);
        oracle.setPrice(address(tsla), 42_180000); // $42.18
        oracle.setPrice(address(nvda), 120_500000); // $120.50

        // Verified-asset registry
        EquencyAssetRegistry registry = new EquencyAssetRegistry(deployer);
        registry.setAsset(address(tsla), true, 18, address(oracle), "TSLA");
        registry.setAsset(address(nvda), true, 18, address(oracle), "NVDA");

        // Execution adapter + reserves so swaps can fill on testnet
        MockDexAdapter adapter = new MockDexAdapter(IERC20(address(usdg)), registry);
        usdg.mint(address(adapter), 5_000_000e6);
        tsla.mint(address(adapter), 500_000e18);
        nvda.mint(address(adapter), 500_000e18);

        // Factory (users create their own paused+capped vaults)
        EquencyVaultFactory factory =
            new EquencyVaultFactory(IERC20(address(usdg)), registry, IExecutionAdapter(address(adapter)), deployer);

        vm.stopBroadcast();

        console.log("USDG (mock):   ", address(usdg));
        console.log("TSLA (mock):   ", address(tsla));
        console.log("NVDA (mock):   ", address(nvda));
        console.log("Oracle:        ", address(oracle));
        console.log("Registry:      ", address(registry));
        console.log("Adapter:       ", address(adapter));
        console.log("VaultFactory:  ", address(factory));

        _writeJson(block.chainid, address(usdg), address(tsla), address(nvda), address(oracle), address(registry), address(adapter), address(factory));
    }

    function _writeJson(
        uint256 chainId,
        address usdg,
        address tsla,
        address nvda,
        address oracle,
        address registry,
        address adapter,
        address factory
    ) internal {
        string memory o = "equency";
        vm.serializeUint(o, "chainId", chainId);
        vm.serializeAddress(o, "USDG", usdg);
        vm.serializeAddress(o, "TSLA", tsla);
        vm.serializeAddress(o, "NVDA", nvda);
        vm.serializeAddress(o, "Oracle", oracle);
        vm.serializeAddress(o, "Registry", registry);
        vm.serializeAddress(o, "Adapter", adapter);
        string memory json = vm.serializeAddress(o, "VaultFactory", factory);
        string memory path = string.concat("./deployments/", vm.toString(chainId), "-vault.json");
        vm.writeJson(json, path);
        console.log("Wrote", path);
    }
}
