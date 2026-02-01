#!/usr/bin/env node
const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');

const bip32 = BIP32Factory(ecc);

const mnemonic = process.env.GLORB_HD_MNEMONIC;
if (!mnemonic) {
  console.error('GLORB_HD_MNEMONIC not set');
  process.exit(1);
}

const seed = bip39.mnemonicToSeedSync(mnemonic);
const root = bip32.fromSeed(seed);
const path = "m/84'/0'/0'/0/0"; // BIP84 native segwit
const child = root.derivePath(path);

const { address } = bitcoin.payments.p2wpkh({
  pubkey: child.publicKey,
  network: bitcoin.networks.bitcoin,
});

console.log(address);
