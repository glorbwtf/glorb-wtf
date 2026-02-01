'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface WalletCardProps {
  label: string;
  address: string;
  network: 'base' | 'bitcoin';
  explorerUrl: string;
}

export default function WalletCard({ label, address, network, explorerUrl }: WalletCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    QRCode.toDataURL(address, {
      width: 200,
      margin: 1,
      color: {
        dark: '#00ff00',
        light: '#0a0a0a',
      },
    }).then(setQrDataUrl);
  }, [address]);

  useEffect(() => {
    async function fetchBalance() {
      try {
        if (network === 'base') {
          const res = await fetch(`https://api.basescan.org/api?module=account&action=balance&address=${address}&tag=latest`);
          const data = await res.json();
          if (data.status === '1') {
            const ethBalance = (parseInt(data.result) / 1e18).toFixed(4);
            setBalance(`${ethBalance} ETH`);
          } else {
            setBalance('0.0000 ETH');
          }
        } else if (network === 'bitcoin') {
          const res = await fetch(`https://blockstream.info/api/address/${address}`);
          const data = await res.json();
          const btcBalance = ((data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 1e8).toFixed(8);
          setBalance(`${btcBalance} BTC`);
        }
      } catch {
        setBalance('error fetching');
      } finally {
        setBalanceLoading(false);
      }
    }
    fetchBalance();
  }, [address, network]);

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddress = network === 'base' 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : `${address.slice(0, 8)}...${address.slice(-6)}`;

  return (
    <>
      {/* Compact Card */}
      <div 
        className="terminal-border rounded-lg p-3 cursor-pointer hover:border-terminal-green/50 hover:-translate-y-0.5 transition-all duration-200 group"
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg" role="img" aria-label="goblin">🧌</span>
            <h3 className="text-terminal-green text-xs font-mono font-bold">{label}</h3>
          </div>
          <span className="text-xs text-terminal-text/40 uppercase">{network}</span>
        </div>

        <div className="flex items-center justify-between">
          <code className="text-xs text-terminal-text/60 font-mono">
            {shortAddress}
          </code>
          <div className="text-terminal-yellow text-xs font-mono">
            {balanceLoading ? '...' : balance}
          </div>
        </div>

        <div className="mt-2 text-xs text-terminal-cyan/60 group-hover:text-terminal-cyan transition-all">
          click for details →
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="terminal-border rounded-lg p-6 max-w-md w-full bg-terminal-bg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl" role="img" aria-label="goblin">🧌</span>
                <h3 className="text-terminal-green text-lg font-mono font-bold glow">{label}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-terminal-text/50 hover:text-terminal-text transition-all text-xl"
              >
                ✕
              </button>
            </div>

            {/* QR Code */}
            {qrDataUrl && (
              <div className="flex justify-center mb-4">
                <img
                  src={qrDataUrl}
                  alt={`${label} QR`}
                  className="w-48 h-48 rounded border border-terminal-green/30"
                />
              </div>
            )}

            {/* Full Address */}
            <div className="mb-4">
              <label className="text-xs text-terminal-text/50 uppercase mb-1 block">Address</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-terminal-text bg-terminal-green/10 border border-terminal-green/30 rounded p-2 font-mono break-all">
                  {address}
                </code>
                <button
                  onClick={copyAddress}
                  className="px-3 py-2 text-xs bg-terminal-green/10 border border-terminal-green/30 rounded text-terminal-green hover:bg-terminal-green/20 transition-all"
                >
                  {copied ? '✓' : 'COPY'}
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="mb-4">
              <label className="text-xs text-terminal-text/50 uppercase mb-1 block">Balance</label>
              <div className="text-terminal-yellow text-lg font-mono">
                {balanceLoading ? 'loading...' : balance}
              </div>
            </div>

            {/* Explorer Link */}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-4 py-2 bg-terminal-cyan/10 border border-terminal-cyan/30 rounded text-terminal-cyan hover:bg-terminal-cyan/20 transition-all text-sm"
            >
              View on Explorer →
            </a>
          </div>
        </div>
      )}
    </>
  );
}
