<template>
  <Step :step="1">
    <h2>Step 1: Login Keplr</h2>
    <Account />
  </Step>
  <Step :step="2">
    <h2>Step 2: Import multisig wallet info</h2>
    <ImportMultisig />
  </Step>
  <Step :step="3">
    <h2>Step 3: Import unsigned tx</h2>
    <ImportUnsignedTx />
  </Step>
  <Step :step="4">
    <h2>Step 4: Confirm tx content and sign tx</h2>
    <UnsignedTx />
    <button @click="signTx">Sign tx</button>
    <div>
      Signature: {{ displaySignature }}
    </div>
  </Step>
  <Step :step="5">
    <h2>Step 5: Export signature</h2>
    <div>
      Signature: {{ displaySignature }}
    </div>
    <div>
      <button @click="exportSignature">Export</button>
    </div>
  </Step>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

import Step from '@/components/Step.vue';
import Account from '@/components/Account.vue';
import ImportMultisig from '@/components/ImportMultisig.vue';
import UnsignedTx from '@/components/tx/UnsignedTx.vue';
import ImportUnsignedTx from '@/components/tx/ImportUnsignedTx.vue';

import { readAccountChainInfo } from '@/cosmos/client';
import { signTxAmino, SingleSignature } from '@/cosmos/signing';

import { useStepStore, useSignerStore, useMultisigStore, useTxStore } from '@/stores';
import { encodeBase64, generateFileAndDownload } from '@/utils/utils';

const stepStore = useStepStore();
stepStore.setup(5);

const signerStore = useSignerStore();
const multisigStore = useMultisigStore();
const txStore = useTxStore();

const signature = ref(null as SingleSignature | null);
const displaySignature = computed(() => {
  if (!signature.value) {
    return '-';
  }
  return encodeBase64(signature.value.signature);
})

async function signTx() {
  const { accountNumber, sequence } = await readAccountChainInfo(multisigStore.address);
  const aminoSignDoc = txStore.aminoSignDoc(accountNumber, sequence);
  signature.value = await signTxAmino(signerStore.offlineSigner!, signerStore.address, aminoSignDoc);
}

function exportSignature() {
  const json = signature.value!.toJSON();
  const exported = JSON.stringify(json, null, 2);
  generateFileAndDownload(exported, 'signature.json');
}
</script>