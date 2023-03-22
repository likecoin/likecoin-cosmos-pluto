<template>
  <div>
    <div>
      <div v-if="store.address">
        <div>
          Address: <code>{{ addressDisplay }}</code>
          <button @click="logoutSigner">Logout Signer</button>
        </div>
        <div>
          <input type="checkbox" v-model="shouldShowDetails" />Show details
        </div>
        <div v-if="shouldShowDetails">
          Public key: <code>{{ store.publicKey?.toCosmosJSON() }}</code>
        </div>
      </div>
      <div v-else>
        <button v-for="(_, type) of keplrOfflineSignerLoader" @click="initKeplrSigner(type)">
          Init Keplr Signer (by {{ type }})
        </button>
        <button @click="initWeb3AuthSigner()">
          Init Web3Auth Signer
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useSignerStore } from '@/stores';
import { offlineSignerLoader as keplrOfflineSignerLoader, WalletType } from '@/stores/signer';

const store = useSignerStore();

const shouldShowDetails = ref(false);

const addressDisplay = computed(() => {
  const { address } = store;
  if (!address) {
    return '-';
  }
  if (shouldShowDetails.value) {
    return address;
  }
  const LIMIT = 30; // TODO: put into config?
  if (address.length <= LIMIT) {
    return address;
  }
  const tailLength = 8;
  const headLength = LIMIT - tailLength - 3;
  return `${address.slice(0, headLength)}...${address.slice(address.length - tailLength)}`;
});

function logoutSigner() {
  store.logout();
}

async function initKeplrSigner(type: WalletType) {
  store.initKeplr(type);
}

async function initWeb3AuthSigner() {
  store.initWeb3Auth();
}
</script>
