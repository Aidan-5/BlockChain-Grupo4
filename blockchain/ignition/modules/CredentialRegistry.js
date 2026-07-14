const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");


module.exports = buildModule(
    "CredentialRegistryModule",
    (m) => {

        const registry =
            m.contract(
                "CredentialRegistry"
            );


        return {
            registry
        };
    }
);