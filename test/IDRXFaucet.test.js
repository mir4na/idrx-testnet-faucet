const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("IDRXFaucet", function () {
  let faucet;
  let mockToken;
  let owner;
  let user1;
  let user2;

  const DRIP_AMOUNT = 10_000n * 100n; // 10,000 IDRX with 2 decimals
  const COOLDOWN = 24n * 60n * 60n; // 24 hours in seconds
  const INITIAL_FUND = 1_000_000n * 100n; // 1 million IDRX

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC20 token
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock IDRX", "IDRX", 2);
    await mockToken.waitForDeployment();

    // Deploy faucet
    const IDRXFaucet = await ethers.getContractFactory("IDRXFaucet");
    faucet = await IDRXFaucet.deploy(await mockToken.getAddress());
    await faucet.waitForDeployment();

    // Fund the faucet
    await mockToken.mint(owner.address, INITIAL_FUND);
    await mockToken.approve(await faucet.getAddress(), INITIAL_FUND);
    await faucet.fundFaucet(INITIAL_FUND);
  });

  describe("Deployment", function () {
    it("Should set correct IDRX token address", async function () {
      expect(await faucet.idrxToken()).to.equal(await mockToken.getAddress());
    });

    it("Should set correct default drip amount", async function () {
      expect(await faucet.dripAmount()).to.equal(DRIP_AMOUNT);
    });

    it("Should set correct default cooldown period", async function () {
      expect(await faucet.cooldownPeriod()).to.equal(COOLDOWN);
    });

    it("Should revert if token address is zero", async function () {
      const IDRXFaucet = await ethers.getContractFactory("IDRXFaucet");
      await expect(IDRXFaucet.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        faucet,
        "ZeroAddress"
      );
    });
  });

  describe("Claim", function () {
    it("Should allow first-time claim", async function () {
      await expect(faucet.connect(user1).claim())
        .to.emit(faucet, "TokensClaimed")
        .withArgs(user1.address, DRIP_AMOUNT, await time.latest() + 1);

      expect(await mockToken.balanceOf(user1.address)).to.equal(DRIP_AMOUNT);
    });

    it("Should update total distributed and claims", async function () {
      await faucet.connect(user1).claim();

      expect(await faucet.totalDistributed()).to.equal(DRIP_AMOUNT);
      expect(await faucet.totalClaims()).to.equal(1);
    });

    it("Should not allow claim during cooldown", async function () {
      await faucet.connect(user1).claim();

      await expect(faucet.connect(user1).claim()).to.be.revertedWithCustomError(
        faucet,
        "CooldownNotExpired"
      );
    });

    it("Should allow claim after cooldown expires", async function () {
      await faucet.connect(user1).claim();

      // Fast forward 24 hours
      await time.increase(COOLDOWN);

      await expect(faucet.connect(user1).claim()).to.emit(faucet, "TokensClaimed");

      expect(await mockToken.balanceOf(user1.address)).to.equal(DRIP_AMOUNT * 2n);
    });

    it("Should revert if faucet has insufficient balance", async function () {
      // Drain the faucet
      await faucet.emergencyWithdraw();

      await expect(faucet.connect(user1).claim()).to.be.revertedWithCustomError(
        faucet,
        "InsufficientFaucetBalance"
      );
    });
  });

  describe("canClaim", function () {
    it("Should return true for first-time user", async function () {
      const [canClaimResult, remainingCooldown] = await faucet.canClaim(user1.address);
      expect(canClaimResult).to.be.true;
      expect(remainingCooldown).to.equal(0);
    });

    it("Should return false during cooldown", async function () {
      await faucet.connect(user1).claim();

      const [canClaimResult, remainingCooldown] = await faucet.canClaim(user1.address);
      expect(canClaimResult).to.be.false;
      expect(remainingCooldown).to.be.greaterThan(0);
    });

    it("Should return true after cooldown", async function () {
      await faucet.connect(user1).claim();
      await time.increase(COOLDOWN);

      const [canClaimResult, remainingCooldown] = await faucet.canClaim(user1.address);
      expect(canClaimResult).to.be.true;
      expect(remainingCooldown).to.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set drip amount", async function () {
      const newAmount = 20_000n * 100n;

      await expect(faucet.setDripAmount(newAmount))
        .to.emit(faucet, "DripAmountUpdated")
        .withArgs(DRIP_AMOUNT, newAmount);

      expect(await faucet.dripAmount()).to.equal(newAmount);
    });

    it("Should not allow non-owner to set drip amount", async function () {
      await expect(faucet.connect(user1).setDripAmount(1000)).to.be.revertedWithCustomError(
        faucet,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should allow owner to set cooldown period", async function () {
      const newPeriod = 12n * 60n * 60n; // 12 hours

      await expect(faucet.setCooldownPeriod(newPeriod))
        .to.emit(faucet, "CooldownPeriodUpdated")
        .withArgs(COOLDOWN, newPeriod);

      expect(await faucet.cooldownPeriod()).to.equal(newPeriod);
    });

    it("Should allow owner to emergency withdraw", async function () {
      const balanceBefore = await mockToken.balanceOf(owner.address);

      await expect(faucet.emergencyWithdraw())
        .to.emit(faucet, "EmergencyWithdraw")
        .withArgs(owner.address, INITIAL_FUND);

      expect(await mockToken.balanceOf(owner.address)).to.equal(balanceBefore + INITIAL_FUND);
      expect(await faucet.getFaucetBalance()).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should return correct faucet balance", async function () {
      expect(await faucet.getFaucetBalance()).to.equal(INITIAL_FUND);
    });

    it("Should return correct remaining claims", async function () {
      const expectedClaims = INITIAL_FUND / DRIP_AMOUNT;
      expect(await faucet.getRemainingClaims()).to.equal(expectedClaims);
    });
  });
});
