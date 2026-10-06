// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {EquencyStrategyVault} from "./EquencyStrategyVault.sol";
import {EquencyAssetRegistry} from "./EquencyAssetRegistry.sol";
import {IExecutionAdapter} from "./interfaces/IExecutionAdapter.sol";

/// @title EquencyVaultFactory
/// @notice Deploys non-custodial per-user Strategy Vaults, each bound to the user's chosen
/// strategy constraints (brief §48). USDG, the verified-asset registry and the canonical
/// execution adapter are shared, so a new strategy integration never touches existing vaults.
contract EquencyVaultFactory is Ownable {
    IERC20 public immutable usdg;
    EquencyAssetRegistry public immutable registry;
    IExecutionAdapter public adapter; // canonical execution route for new vaults

    mapping(address => address[]) private _vaultsOf;
    address[] public allVaults;

    event AdapterSet(address indexed adapter);
    event VaultCreated(
        address indexed owner,
        address indexed vault,
        uint16 maxPositionBps,
        uint16 cashReserveBps,
        uint8 maxPositions,
        uint256 depositCap
    );

    constructor(IERC20 usdg_, EquencyAssetRegistry registry_, IExecutionAdapter adapter_, address owner_)
        Ownable(owner_)
    {
        usdg = usdg_;
        registry = registry_;
        adapter = adapter_;
    }

    function setAdapter(IExecutionAdapter adapter_) external onlyOwner {
        adapter = adapter_;
        emit AdapterSet(address(adapter_));
    }

    /// Create a vault owned by the caller. Ships paused + capped; the user unpauses after
    /// reviewing the (unaudited) contracts, then deposits USDG.
    function createVault(
        uint16 maxPositionBps,
        uint16 cashReserveBps,
        uint8 maxPositionsCount,
        uint256 depositCap
    ) external returns (address vault) {
        EquencyStrategyVault v = new EquencyStrategyVault(
            usdg, registry, adapter, maxPositionBps, cashReserveBps, maxPositionsCount, depositCap, msg.sender
        );
        vault = address(v);
        _vaultsOf[msg.sender].push(vault);
        allVaults.push(vault);
        emit VaultCreated(msg.sender, vault, maxPositionBps, cashReserveBps, maxPositionsCount, depositCap);
    }

    function vaultsOf(address user) external view returns (address[] memory) {
        return _vaultsOf[user];
    }

    function vaultCount() external view returns (uint256) {
        return allVaults.length;
    }
}
