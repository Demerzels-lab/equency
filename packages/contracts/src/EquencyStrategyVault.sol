// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {EquencyAssetRegistry} from "./EquencyAssetRegistry.sol";
import {IExecutionAdapter} from "./interfaces/IExecutionAdapter.sol";

/// @title EquencyStrategyVault
/// @notice Non-custodial USDG vault (the accounting/custody layer, web3-ship §3). Holds
/// USDG + verified assets, mints shares priced by NAV, and only ever touches tokens the
/// AssetRegistry has verified. Strategy constraints (max position / cash reserve / max
/// positions) are enforced ON-CHAIN — the frontend is never trusted (brief §73). The AI
/// never signs: the owner (user) authorises every allocation (GUIDED default, brief §34).
/// Ships PAUSED + capped (unaudited launch posture, web3-ship §7).
contract EquencyStrategyVault is ERC4626, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    EquencyAssetRegistry public immutable registry;
    uint16 public immutable maxPositionBps; // of NAV
    uint16 public immutable cashReserveBps; // of NAV
    uint8 public immutable maxPositionsCount;
    uint256 public immutable depositCap; // in USDG base units

    uint256 public constant MAX_PRICE_STALENESS = 1 hours;

    IExecutionAdapter public adapter; // whitelisted execution route (owner-set)

    address[] public positions;
    mapping(address => bool) public isPosition;

    event AdapterSet(address indexed adapter);
    event Allocated(address indexed asset, uint256 usdgIn, uint256 amountOut);
    event Divested(address indexed asset, uint256 amountIn, uint256 usdgOut);

    constructor(
        IERC20 usdg_,
        EquencyAssetRegistry registry_,
        IExecutionAdapter adapter_,
        uint16 maxPositionBps_,
        uint16 cashReserveBps_,
        uint8 maxPositionsCount_,
        uint256 depositCap_,
        address owner_
    ) ERC20("EQUENCY Strategy Vault", "eqVAULT") ERC4626(usdg_) Ownable(owner_) {
        require(maxPositionBps_ <= 10_000 && cashReserveBps_ <= 10_000, "bps");
        require(maxPositionsCount_ > 0, "positions");
        registry = registry_;
        adapter = adapter_; // canonical execution route set at creation; owner may update later
        maxPositionBps = maxPositionBps_;
        cashReserveBps = cashReserveBps_;
        maxPositionsCount = maxPositionsCount_;
        depositCap = depositCap_;
        _pause(); // unaudited ⇒ deposits off until a deliberate unpause after review
    }

    /// Virtual-offset share math blunts the first-deposit inflation attack (web3-ship §5).
    function _decimalsOffset() internal pure override returns (uint8) {
        return 3;
    }

    // ----------------------------------------------------------------- NAV

    function _idle() internal view returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    /// NAV = idle USDG + Σ(position value via registry oracle), all in USDG 6dp.
    function totalAssets() public view override returns (uint256 total) {
        total = _idle();
        uint256 n = positions.length;
        for (uint256 i; i < n; ++i) {
            address a = positions[i];
            uint256 bal = IERC20(a).balanceOf(address(this));
            if (bal == 0) continue;
            (uint256 v,) = registry.valueInUsdg(a, bal);
            total += v;
        }
    }

    function positionValue(address assetAddr) public view returns (uint256 v) {
        (v,) = registry.valueInUsdg(assetAddr, IERC20(assetAddr).balanceOf(address(this)));
    }

    function positionsList() external view returns (address[] memory) {
        return positions;
    }

    // ----------------------------------------------------------- deposit caps

    function maxDeposit(address) public view override returns (uint256) {
        if (paused()) return 0;
        uint256 ta = totalAssets();
        return depositCap > ta ? depositCap - ta : 0;
    }

    function maxMint(address receiver) public view override returns (uint256) {
        return previewDeposit(maxDeposit(receiver));
    }

    // -------------------------------------------- withdrawals clamped to liquidity

    function maxWithdraw(address owner_) public view override returns (uint256) {
        uint256 byShares = _convertToAssets(balanceOf(owner_), Math.Rounding.Floor);
        uint256 idle = _idle();
        return byShares < idle ? byShares : idle;
    }

    function maxRedeem(address owner_) public view override returns (uint256) {
        uint256 byLiquidity = _convertToShares(_idle(), Math.Rounding.Floor);
        uint256 bal = balanceOf(owner_);
        return byLiquidity < bal ? byLiquidity : bal;
    }

    // ----------------------------------------------------------------- admin

    function setAdapter(IExecutionAdapter adapter_) external onlyOwner {
        adapter = adapter_;
        emit AdapterSet(address(adapter_));
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ------------------------------------------------------------- allocation

    /// Buy `asset` with `usdgAmount` of idle USDG, enforcing all strategy limits on-chain.
    function allocate(address assetAddr, uint256 usdgAmount) external onlyOwner whenNotPaused nonReentrant {
        require(address(adapter) != address(0), "no adapter");
        require(registry.isSupported(assetAddr), "asset not verified");
        require(usdgAmount > 0, "amount=0");

        uint256 idle = _idle();
        require(usdgAmount <= idle, "exceeds idle");

        uint256 nav = totalAssets();
        EquencyAssetRegistry.Asset memory a = registry.getAsset(assetAddr);
        (, uint256 updatedAt) = registry.valueInUsdg(assetAddr, 10 ** a.decimals);
        require(block.timestamp - updatedAt <= MAX_PRICE_STALENESS, "stale oracle");

        // cash reserve must survive the trade
        uint256 idleAfter = idle - usdgAmount;
        require(idleAfter * 10_000 >= uint256(cashReserveBps) * nav, "cash reserve");

        // single-position cap (existing value + new spend) ≤ maxPosition * NAV
        uint256 existing = positionValue(assetAddr);
        require((existing + usdgAmount) * 10_000 <= uint256(maxPositionBps) * nav, "position cap");

        bool newPos = !isPosition[assetAddr];
        if (newPos) require(positions.length < maxPositionsCount, "too many positions");

        // approval-free: transfer then invest; adapter returns what it actually delivered
        IERC20(asset()).safeTransfer(address(adapter), usdgAmount);
        uint256 got = adapter.invest(assetAddr, usdgAmount);
        require(got > 0, "no fill");

        if (newPos) {
            positions.push(assetAddr);
            isPosition[assetAddr] = true;
        }
        emit Allocated(assetAddr, usdgAmount, got);
    }

    /// Sell `amountIn` of a held `asset` back to USDG.
    function divest(address assetAddr, uint256 amountIn) external onlyOwner nonReentrant {
        require(isPosition[assetAddr], "not a position");
        require(address(adapter) != address(0), "no adapter");
        uint256 bal = IERC20(assetAddr).balanceOf(address(this));
        require(amountIn > 0 && amountIn <= bal, "exceeds balance");

        IERC20(assetAddr).safeTransfer(address(adapter), amountIn);
        uint256 usdgOut = adapter.divest(assetAddr, amountIn);

        if (IERC20(assetAddr).balanceOf(address(this)) == 0) _removePosition(assetAddr);
        emit Divested(assetAddr, amountIn, usdgOut);
    }

    function _removePosition(address assetAddr) internal {
        isPosition[assetAddr] = false;
        uint256 n = positions.length;
        for (uint256 i; i < n; ++i) {
            if (positions[i] == assetAddr) {
                positions[i] = positions[n - 1];
                positions.pop();
                break;
            }
        }
    }
}
