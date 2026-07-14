const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialRegistry", function () {
  async function deployRegistry() {
    const [issuer, otherAccount] = await ethers.getSigners();
    const CredentialRegistry = await ethers.getContractFactory(
      "CredentialRegistry",
    );
    const registry = await CredentialRegistry.deploy();
    return { registry, issuer, otherAccount };
  }

  it("registra una credencial por hash", async function () {
    const { registry, issuer } = await deployRegistry();
    const hash = "abc123hash";

    await expect(registry.registerCredential(hash)).to.emit(
      registry,
      "CredentialRegistered",
    );

    const [valid, timestamp, issuerAddress] =
      await registry.verifyCredential(hash);

    expect(valid).to.equal(true);
    expect(timestamp).to.be.gt(0);
    expect(issuerAddress).to.equal(issuer.address);
  });

  it("rechaza registrar el mismo hash dos veces", async function () {
    const { registry } = await deployRegistry();
    const hash = "hash-duplicado";

    await registry.registerCredential(hash);

    await expect(registry.registerCredential(hash)).to.be.revertedWith(
      "Credential already exists",
    );
  });

  it("retorna invalido para hash no registrado", async function () {
    const { registry } = await deployRegistry();

    const [valid, timestamp, issuerAddress] =
      await registry.verifyCredential("no-existe");

    expect(valid).to.equal(false);
    expect(timestamp).to.equal(0);
    expect(issuerAddress).to.equal(ethers.ZeroAddress);
  });
});
