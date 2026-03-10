import { expect } from "chai";
import { ethers } from "hardhat";
import { NotesRegistry } from "../typechain-types";

describe("NotesRegistry", function () {
  let registry: NotesRegistry;
  const VALID_HASH = "a".repeat(64); // 64-char SHA256 hex string
  const OTHER_HASH = "b".repeat(64);

  beforeEach(async function () {
    const Factory = await ethers.getContractFactory("NotesRegistry");
    registry = await Factory.deploy();
    await registry.waitForDeployment();
  });

  it("should register a note successfully and emit event", async function () {
    const [uploader] = await ethers.getSigners();
    const tx = await registry.registerNote(VALID_HASH);
    const receipt = await tx.wait();
    expect(receipt?.status).to.equal(1);

    // Verify uploader recorded correctly
    const [addr] = await registry.getNote(VALID_HASH);
    expect(addr).to.equal(uploader.address);
  });

  it("should reject duplicate note hash", async function () {
    await registry.registerNote(VALID_HASH);
    await expect(registry.registerNote(VALID_HASH))
      .to.be.revertedWith("Note already registered");
  });

  it("should reject invalid hash length", async function () {
    await expect(registry.registerNote("tooshort"))
      .to.be.revertedWith("Invalid SHA256 hash length");
  });

  it("verifyNote returns true for registered hash", async function () {
    await registry.registerNote(VALID_HASH);
    expect(await registry.verifyNote(VALID_HASH)).to.equal(true);
  });

  it("verifyNote returns false for unregistered hash", async function () {
    expect(await registry.verifyNote(OTHER_HASH)).to.equal(false);
  });

  it("getNote returns uploader and non-zero timestamp", async function () {
    const [uploader] = await ethers.getSigners();
    await registry.registerNote(VALID_HASH);
    const [addr, ts] = await registry.getNote(VALID_HASH);
    expect(addr).to.equal(uploader.address);
    expect(Number(ts)).to.be.greaterThan(0);
  });

  it("getNote reverts for unknown hash", async function () {
    await expect(registry.getNote(OTHER_HASH)).to.be.revertedWith("Note not found");
  });
});
