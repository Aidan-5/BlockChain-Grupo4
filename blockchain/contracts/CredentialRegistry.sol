// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CredentialRegistry {

    struct Credential {
        string hash;
        uint256 timestamp;
        address issuer;
    }

    mapping(string => Credential) private credentials;


    event CredentialRegistered(
        string hash,
        address issuer,
        uint256 timestamp
    );


    function registerCredential(
        string memory _hash
    ) public {

        require(
            bytes(credentials[_hash].hash).length == 0,
            "Credential already exists"
        );


        credentials[_hash] = Credential(
            _hash,
            block.timestamp,
            msg.sender
        );


        emit CredentialRegistered(
            _hash,
            msg.sender,
            block.timestamp
        );
    }


    function verifyCredential(
        string memory _hash
    )
        public
        view
        returns(
            bool,
            uint256,
            address
        )
    {

        Credential memory credential =
            credentials[_hash];


        if(
            bytes(credential.hash).length == 0
        ){
            return(
                false,
                0,
                address(0)
            );
        }


        return(
            true,
            credential.timestamp,
            credential.issuer
        );
    }
}