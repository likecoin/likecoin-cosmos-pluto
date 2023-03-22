import { defineStore } from 'pinia';

import { pubkeyToAddress, OfflineAminoSigner } from '@cosmjs/amino';
import { OfflineSigner } from '@cosmjs/proto-signing';
import {
  getBrowserKeplrOfflineSigner,
  getMobileKeplrOfflineSigner,
  registerKeplrKeystoreChangeCallback,
} from '@/keplr/keplr';
import { getWeb3AuthOfflineSigner } from '@/web3auth/web3auth';
import { PubKey } from '@/cosmos/pubkey';

export const offlineSignerLoader = {
  browser: getBrowserKeplrOfflineSigner,
  mobile: getMobileKeplrOfflineSigner,
} as const;

export type WalletType = keyof typeof offlineSignerLoader;

import { CHAIN_ID, BECH32_PREFIX } from "@/config";

export const useSignerStore = defineStore('signer', {
  state: () => ({
    offlineSigner: null as OfflineSigner | null,
    publicKey: null as PubKey | null,
    keplrUnregisterFn: null as (() => void) | null,
  }),
  getters: {
    address: (state) =>
      state.publicKey === null ?
        '' :
        pubkeyToAddress(state.publicKey.aminoPubKey, BECH32_PREFIX),
    aminoSigner: (state) => {
      if (!state.offlineSigner) {
        return null;
      }
      if (typeof (state.offlineSigner as any).signAmino !== 'function') {
        return null;
      }
      return state.offlineSigner as OfflineAminoSigner;
    }
  },
  actions: {
    async setSigner(signer: OfflineSigner) {
      const account = (await signer.getAccounts())[0];
      this.offlineSigner = signer;
      this.publicKey = PubKey.fromKeplrAccount(account)
    },
    async initWeb3Auth() {
      this.logout();
      this.setSigner(await getWeb3AuthOfflineSigner());
    },
    async initKeplr(type: WalletType) {
      this.logout();
      this.keplrUnregisterFn = registerKeplrKeystoreChangeCallback(() => {
        this.getFromKeplr(type);
      });
      this.getFromKeplr(type);
    },
    async getFromKeplr(type: WalletType) {
      const keplrSigner = await offlineSignerLoader[type](CHAIN_ID, {
        disableBalanceCheck: true,
        preferNoSetFee: true,
        preferNoSetMemo: true,
      });
      this.setSigner(keplrSigner);
    },
    logout() {
      this.offlineSigner = null;
      this.publicKey = null;
      if (this.keplrUnregisterFn) {
        this.keplrUnregisterFn();
        this.keplrUnregisterFn = null;
      }
    },
  },
});

export default useSignerStore;
