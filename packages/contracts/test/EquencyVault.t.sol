// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {EquencyAssetRegistry} from "../src/EquencyAssetRegistry.sol";
import {EquencyStrategyVault} from "../src/EquencyStrategyVault.sol";
import {EquencyVaultFactory} from "../src/EquencyVaultFactory.sol";
import {IExecutionAdapter} from "../src/interfaces/IExecutionAdapter.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockOracle} from "../src/mocks/MockOracle.sol";
import {MockDexAdapter} from "../src/mocks/MockDexAdapter.sol";

contract EquencyVaultTest is Test {
    address owner = makeAddr("protocolOwner");
    address user = makeAddr("user");

    MockERC20 usdg;
    MockERC20 tsla;
    MockOracle oracle;
    EquencyAssetRegistry registry;
    MockDexAdapter adapter;
    EquencyVaultFactory factory;

    uint256 constant CAP = 1_000_000e6;
    uint256 constant PRICE_TSLA = 42_180000; // $42.18 in 6dp

    function setUp() public {
        usdg = new MockERC20("USD Global", "USDG", 6);
        tsla = new MockERC20("Tesla RH Token", "TSLA", 18);

        vm.startPrank(owner);
        oracle = new MockOracle(owner);
        oracle.setPrice(address(tsla), PRICE_TSLA);
        registry = new EquencyAssetRegistry(owner);
        registry.setAsset(address(tsla), true, 18, address(oracle), "TSLA");
        vm.stopPrank();

        adapter = new MockDexAdapter(IERC20(address(usdg)), registry);
        // seed adapter reserves so it can fill swaps both ways
        tsla.mint(address(adapter), 1_000_000e18);
        usdg.mint(address(adapter), 10_000_000e6);

        factory = new EquencyVaultFactory(
            IERC20(address(usdg)), registry, IExecutionAdapter(address(adapter)), owner
        );
    }

    function _newVault(uint16 maxPosBps, uint16 cashBps, uint8 maxPos) internal returns (EquencyStrategyVault v) {
        vm.prank(user);
        v = EquencyStrategyVault(factory.createVault(maxPosBps, cashBps, maxPos, CAP));
    }

    function _fundAndOpen(EquencyStrategyVault v, uint256 amount) internal {
        usdg.mint(user, amount);
        vm.startPrank(user);
        v.unpause(); // user acknowledges unaudited + opens deposits
        usdg.approve(address(v), amount);
        v.deposit(amount, user);
        vm.stopPrank();
    }

    // ---------------------------------------------------------- lifecycle

    function test_ShipsPaused_DepositBlockedUntilUnpause() public {
        EquencyStrategyVault v = _newVault(3000, 2000, 5);
        assertTrue(v.paused(), "should ship paused");
        assertEq(v.maxDeposit(user), 0, "no deposits while paused");

        usdg.mint(user, 1000e6);
        vm.startPrank(user);
        usdg.approve(address(v), 1000e6);
        vm.expectRevert(); // ERC4626ExceededMaxDeposit
        v.deposit(1000e6, user);
        vm.stopPrank();
    }

    function test_DepositMintsSharesAndWithdraws() public {
        EquencyStrategyVault v = _newVault(3000, 2000, 5);
        _fundAndOpen(v, 10_000e6);

        assertEq(v.totalAssets(), 10_000e6, "NAV == deposit");
        assertGt(v.balanceOf(user), 0, "shares minted");

        vm.prank(user);
        v.withdraw(4_000e6, user, user);
        assertEq(usdg.balanceOf(user), 4_000e6, "withdrew idle USDG");
        assertApproxEqAbs(v.totalAssets(), 6_000e6, 1, "NAV reduced");
    }

    function test_DepositCapEnforced() public {
        EquencyStrategyVault v = _newVault(3000, 2000, 5);
        usdg.mint(user, CAP + 1e6);
        vm.startPrank(user);
        v.unpause();
        usdg.approve(address(v), CAP + 1e6);
        vm.expectRevert();
        v.deposit(CAP + 1e6, user); // over cap
        v.deposit(CAP, user); // exactly cap ok
        assertEq(v.maxDeposit(user), 0, "cap reached");
        vm.stopPrank();
    }

    function test_InflationAttackMitigated() public {
        EquencyStrategyVault v = _newVault(3000, 2000, 5);
        // attacker opens, deposits 1 wei, donates a large amount directly
        usdg.mint(user, 1);
        vm.startPrank(user);
        v.unpause();
        usdg.approve(address(v), 1);
        v.deposit(1, user);
        vm.stopPrank();
        usdg.mint(address(v), 2_000e6); // donation to inflate share price

        // victim deposits; must receive non-trivial shares (virtual offset protects them)
        address victim = makeAddr("victim");
        usdg.mint(victim, 2_000e6);
        vm.startPrank(victim);
        usdg.approve(address(v), 2_000e6);
        uint256 shares = v.deposit(2_000e6, victim);
        vm.stopPrank();
        assertGt(shares, 0, "victim got shares");
        // victim can redeem back roughly their deposit (not stolen)
        assertGt(v.convertToAssets(shares), 1_000e6, "victim keeps most value");
    }

    // ------------------------------------------------------------- allocate

    function test_AllocateHoldsAssetAndPreservesNav() public {
        EquencyStrategyVault v = _newVault(3000, 2000, 5);
        _fundAndOpen(v, 10_000e6);

        uint256 navBefore = v.totalAssets();
        vm.prank(user);
        v.allocate(address(tsla), 3_000e6);

        assertGt(tsla.balanceOf(address(v)), 0, "vault holds TSLA");
        assertEq(v.positionsList().length, 1, "one position");
        // NAV preserved within the 0.30% swap fee
        assertApproxEqRel(v.totalAssets(), navBefore, 0.004e18, "NAV ~preserved");
    }

    function test_Allocate_RejectsUnverifiedAsset() public {
        EquencyStrategyVault v = _newVault(3000, 2000, 5);
        _fundAndOpen(v, 10_000e6);
        MockERC20 rogue = new MockERC20("Rogue", "RGE", 18);
        vm.prank(user);
        vm.expectRevert(bytes("asset not verified"));
        v.allocate(address(rogue), 1_000e6);
    }

    function test_Allocate_RejectsOverMaxPosition() public {
        EquencyStrategyVault v = _newVault(3000, 2000, 5); // 30% max
        _fundAndOpen(v, 10_000e6);
        vm.prank(user);
        vm.expectRevert(bytes("position cap"));
        v.allocate(address(tsla), 3_001e6); // > 30% of 10k NAV
    }

    function test_Allocate_RejectsBreakingCashReserve() public {
        EquencyStrategyVault v = _newVault(9000, 2000, 5); // 90% max pos, 20% cash
        _fundAndOpen(v, 10_000e6);
        vm.prank(user);
        vm.expectRevert(bytes("cash reserve"));
        v.allocate(address(tsla), 8_500e6); // leaves 1.5k idle < 2k reserve
    }

    function test_Allocate_RejectsTooManyPositions() public {
        EquencyStrategyVault v = _newVault(3000, 1000, 1); // only 1 position
        _fundAndOpen(v, 10_000e6);
        // add a second verified asset
        MockERC20 nvda = new MockERC20("NVDA RH", "NVDA", 18);
        vm.startPrank(owner);
        oracle.setPrice(address(nvda), 120_000000);
        registry.setAsset(address(nvda), true, 18, address(oracle), "NVDA");
        vm.stopPrank();

        vm.startPrank(user);
        v.allocate(address(tsla), 2_000e6);
        vm.expectRevert(bytes("too many positions"));
        v.allocate(address(nvda), 2_000e6);
        vm.stopPrank();
    }

    function test_Allocate_RejectsStaleOracle() public {
        EquencyStrategyVault v = _newVault(3000, 2000, 5);
        _fundAndOpen(v, 10_000e6);
        vm.warp(block.timestamp + 2 hours); // price now stale (> MAX_PRICE_STALENESS)
        vm.prank(user);
        vm.expectRevert(bytes("stale oracle"));
        v.allocate(address(tsla), 1_000e6);
    }

    // -------------------------------------------------------------- divest

    function test_DivestReturnsUsdgAndClearsPosition() public {
        EquencyStrategyVault v = _newVault(3000, 2000, 5);
        _fundAndOpen(v, 10_000e6);
        vm.startPrank(user);
        v.allocate(address(tsla), 3_000e6);
        uint256 held = tsla.balanceOf(address(v));
        v.divest(address(tsla), held);
        vm.stopPrank();
        assertEq(tsla.balanceOf(address(v)), 0, "position closed");
        assertEq(v.positionsList().length, 0, "position removed");
        // NAV back near 10k minus two swap fees
        assertApproxEqRel(v.totalAssets(), 10_000e6, 0.01e18, "NAV round-trip");
    }

    // ------------------------------------------------- liquidity-clamped exit

    function test_MaxWithdrawClampedToIdle() public {
        EquencyStrategyVault v = _newVault(3000, 1000, 5); // 10% cash so we can deploy more
        _fundAndOpen(v, 10_000e6);
        vm.prank(user);
        v.allocate(address(tsla), 3_000e6); // 3k now in TSLA, 7k idle
        // user's shares are worth ~10k but only idle USDG is withdrawable
        assertApproxEqAbs(v.maxWithdraw(user), 7_000e6, 2, "clamped to idle");
    }

    // ----------------------------------------------------------- access ctrl

    function test_OnlyOwnerCanAllocate() public {
        EquencyStrategyVault v = _newVault(3000, 2000, 5);
        _fundAndOpen(v, 10_000e6);
        vm.prank(makeAddr("stranger"));
        vm.expectRevert(); // OwnableUnauthorizedAccount
        v.allocate(address(tsla), 1_000e6);
    }
}
