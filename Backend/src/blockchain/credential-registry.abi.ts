export const CREDENTIAL_REGISTRY_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'hash', type: 'string' },
      { indexed: false, internalType: 'address', name: 'issuer', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'CredentialRegistered',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'string', name: '_hash', type: 'string' }],
    name: 'registerCredential',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: '_hash', type: 'string' }],
    name: 'verifyCredential',
    outputs: [
      { internalType: 'bool', name: '', type: 'bool' },
      { internalType: 'uint256', name: '', type: 'uint256' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
