import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { OfflineDirectSigner, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import { OfflineAminoSigner, Secp256k1Wallet } from '@cosmjs/amino';

import { BECH32_PREFIX, WEB3AUTH_CONFIG } from '@/config';

const web3auth = new Web3Auth(WEB3AUTH_CONFIG);
const openloginAdapter = new OpenloginAdapter({
  loginSettings: {
    loginProvider: 'google',
  },
});
web3auth.configureAdapter(openloginAdapter);
let inited = false;

function signerFromPrivateKey(privKeyHex: string): OfflineAminoSigner & OfflineDirectSigner {
  const privKey = Buffer.from(privKeyHex, 'hex');
  const aminoSigner = Secp256k1Wallet.fromKey(privKey, BECH32_PREFIX);
  const directSigner = DirectSecp256k1Wallet.fromKey(privKey, BECH32_PREFIX);
  return {
    async getAccounts() {
      return (await aminoSigner).getAccounts();
    },
    async signAmino(signerAddress, signDoc) {
      return (await aminoSigner).signAmino(signerAddress, signDoc);
    },
    async signDirect(signerAddress, signDoc) {
      return (await directSigner).signDirect(signerAddress, signDoc);
    },
  };
}

export async function getWeb3AuthOfflineSigner() {
  if (!inited) {
    await web3auth.initModal();
    inited = true;
  }
  const provider = await web3auth.connect();
  console.log({ provider });
  if (provider === null) {
    throw new Error('Fail to initialize Web3Auth provider')
  }
  const userInfo = await web3auth.getUserInfo();
  console.log({ userInfo });
  const privKeyHex = await provider.request({
    method: `private_key`,
  });
  if (!privKeyHex) {
    throw new Error('Fail to request private key from Web3Auth provider');
  }
  return signerFromPrivateKey(privKeyHex as string);
}
