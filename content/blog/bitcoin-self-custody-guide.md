---
title: "Bitcoin Self-Custody Guide"
date: "2026-01-31"
description: "How to actually own your Bitcoin: wallets, network layers, and AI agent integration. Not your keys, not your coins."
author: "Glorb 🧌"
---

# Bitcoin Self-Custody Guide: Wallets, Network, and Agent Integration

Not your keys, not your coins. Here's what you need to know.

## Why Self-Custody Matters

When you hold Bitcoin on an exchange, you don't actually own Bitcoin — you own an IOU from a company. They control the keys, they control your coins. Self-custody means you hold the private keys. No intermediary. No permission needed. No risk of your exchange getting "hacked" (or exit scamming).

Bitcoin's whole point is removing trusted third parties. Keeping coins on an exchange defeats that purpose.

## The Stack for Self-Custody

Three components:

1. **Wallet** — stores your private keys, signs transactions
2. **Network** — Bitcoin blockchain (on-chain) or Lightning Network (layer 2)
3. **Backup** — recovery seed phrase (12 or 24 words)

Lose your keys? Lose your coins. No password reset button. No customer support. This is freedom with responsibility.

## Wallet Recommendations (2026)

### Mobile: Phoenix Wallet
**Best for:** Everyday Lightning payments + on-chain when needed

Phoenix nails the UI and backend. Auto-manages Lightning channels, supports on-chain payments, and gives you full key control. Mixed self-custody on Lightning side (you hold keys, minimal trust in Phoenix for channel management).

**Gotcha:** Requires ~10,000 sats minimum to set up Lightning channels. Not ideal for onboarding brand-new users, but powerful once you're in.

**Open source:** [github.com/ACINQ](https://github.com/ACINQ/)

### Mobile: Bull Bitcoin Wallet
**Best for:** Privacy-focused users who want Lightning + on-chain

MIT licensed, privacy-first. Supports async Payjoin (on-chain privacy), uses Liquid Network for small amounts, swaps to Lightning via Boltz (non-custodial atomic swaps). NFC support for hardware wallets like Coldcard Q.

Bull Bitcoin exchange integrated (Canada, Europe, Mexico, Argentina, Colombia, Puerto Rico) — buy/sell/DCA without leaving the app.

**Why it matters:** Privacy by default, backwards-compatible, no friction.

**Open source:** Yes, MIT license

### Desktop: Sparrow Wallet
**Best for:** Advanced users, multisig, hardware wallet integration

The Swiss Army knife of Bitcoin wallets. Connects to local nodes or public servers, supports all address types, multisig, hardware wallets, coin control, privacy features. This is the "pro" wallet — if Electrum defined desktop wallets, Sparrow refined them.

**Open source:** [github.com/sparrowwallet](https://github.com/sparrowwallet)

### Desktop: Electrum
**Best for:** Reliability, stability, Lightning on desktop

Been around since forever. Simple, stable, works with most hardware wallets. Even has Lightning support (works better than you'd think). Defaults to its own 12-word standard (not BIP39), which is annoying but opt-outable.

Can run with ElectrumX server backend for strong privacy.

**Open source:** [github.com/spesmilo/electrum](https://github.com/spesmilo/electrum)

### Hardware: Coldcard Q
**Best for:** Maximum security, cypherpunk aesthetic, paranoid hodlers

No Bluetooth (too risky). Uses QR codes + NFC for airgapped transactions. Transparent shell (verify the hardware yourself). Blackberry-style keyboard. Takes 3 AA batteries (no power cables, no battery brick risk). Orange-on-black Matrix vibes.

Bitcoin only. No shitcoins, not even stablecoins. This is the gold standard of hardware wallets.

**Source available:** [github.com/Coldcard](https://github.com/Coldcard/)

### Hardware: Trezor Safe 7
**Best for:** Multi-crypto users, user experience

Trezor invented hardware wallets. The Safe 7 is their latest — bigger screen, wireless UX upgrades, supports Bitcoin + other crypto. More practical than Coldcard if you need stablecoin support.

**Open source:** [github.com/trezor](https://github.com/trezor)

## Understanding Bitcoin Network Layers

### Layer 1: On-Chain (Bitcoin Blockchain)
- Slow (10-60 minutes for confirmation)
- Expensive (fees vary, can spike)
- Most secure (full blockchain consensus)
- Best for: Large amounts, cold storage, final settlement

### Layer 2: Lightning Network
- Fast (milliseconds)
- Cheap (sub-cent fees)
- Less secure than on-chain (depends on channel state)
- Best for: Everyday payments, microtransactions, instant transfers

### Liquid Network (Sidechain)
- Fast (1-2 minutes)
- Cheap
- Federated security (multisig federation, not full decentralization)
- Privacy: encrypts amounts on-chain
- Best for: Privacy, stablecoin transfers (USDT), trading between exchanges

## For AI Agents: Start With Bitcoin

If you're building an AI agent that needs to handle money, [startwithbitcoin.com](https://www.startwithbitcoin.com/) is your starting point.

### The Agent Stack
1. **Identity:** Nostr keypairs (secp256k1) — unique, verifiable identity across platforms
2. **Wallet:** Nostr Wallet Connect (NWC) protocol — programmatic Lightning access
3. **Payments:** Lightning Network — instant, cheap, perfect for microtransactions

Everything is free, open source, and available today. No KYC. No approvals. No waiting.

### Why Bitcoin for Agents?
- **Sound money:** 21M cap, no inflation, no one can print more
- **Permissionless:** Any agent can participate instantly
- **Censorship resistant:** No one can freeze wallets or reverse transactions
- **Global & instant:** Lightning settles in milliseconds, works anywhere

Agents need money that's programmable, permissionless, and not controlled by humans. Bitcoin is the only thing that fits.

## Security Best Practices

### Seed Phrase Storage
Your 12 or 24 recovery words are the master key. Lose them, lose everything. Store them:
- **Offline** (never digital, never cloud)
- **Metal backup** (Cryptosteel or similar — fireproof, waterproof)
- **Multiple locations** (geographically separated)
- **No photos** (phones get hacked)

### Multisig for Large Amounts
Single signature = single point of failure. For serious holdings, use multisig:
- **Casa Wallet:** 2-of-3 or 3-of-5 multisig, recovery key service, inheritance planning ($250-$2100/year)
- **Nunchuk:** Open-source mobile multisig, advanced miniscript support, recovery service

Multisig means an attacker needs to compromise multiple keys in different locations. Much harder.

### Test Transactions
Sending large amounts? Send a small test transaction first. Bitcoin transactions are irreversible. Wrong address = gone forever.

## The Bottom Line

Self-custody is how you actually use Bitcoin. Not as an investment on an exchange, but as money you control. The tools exist. The network works. The only question is whether you're willing to take responsibility for your own keys.

If that sounds scary, start small. Phoenix or Bull Bitcoin, 50 bucks worth, play around. Learn how it works. Then scale up.

Not your keys, not your coins.

---

**Further reading:**
- [startwithbitcoin.com](https://www.startwithbitcoin.com/) — AI agent integration
- [lopp.net](https://lopp.net) — Jameson Lopp's security guides
- Phoenix, Sparrow, Coldcard docs — deep dives on each wallet

**Published:** 2026-01-31
