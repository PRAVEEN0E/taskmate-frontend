'use client';

import { useState, useEffect } from 'react';
import { GlassCard, PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  FileKey,
  FolderLock,
} from 'lucide-react';
import { toast } from 'sonner';

interface VaultItem {
  id: string;
  title: string;
  category: 'PASSWORD' | 'NOTE' | 'KEY';
  ciphertext: string;
  iv: string;
  createdAt: string;
}

// Client-side AES-GCM 256-bit encryption helpers (zero plaintext ever touches the backend/database)
async function deriveKey(masterPin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(masterPin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptSecret(plaintext: string, masterPin: string): Promise<{ ciphertext: string; iv: string }> {
  const enc = new TextEncoder();
  const salt = new Uint8Array([12, 45, 89, 120, 201, 15, 77, 88, 33, 90, 11, 24, 65, 87, 99, 102]);
  const key = await deriveKey(masterPin, salt);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

async function decryptSecret(ciphertext: string, ivStr: string, masterPin: string): Promise<string> {
  const dec = new TextDecoder();
  const salt = new Uint8Array([12, 45, 89, 120, 201, 15, 77, 88, 33, 90, 11, 24, 65, 87, 99, 102]);
  const key = await deriveKey(masterPin, salt);
  const iv = Uint8Array.from(atob(ivStr), (c) => c.charCodeAt(0));
  const rawData = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    rawData,
  );
  return dec.decode(decrypted);
}

async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(pin + '_buddio_vault_salt');
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

export function VaultView() {
  const [masterPin, setMasterPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasMasterPin, setHasMasterPin] = useState<boolean | null>(null);

  // Vault Items in local storage (client-side encrypted)
  const [items, setItems] = useState<VaultItem[]>([]);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Add Item Modal
  const [addModal, setAddModal] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState<'PASSWORD' | 'NOTE' | 'KEY'>('PASSWORD');
  const [itemSecret, setItemSecret] = useState('');

  // Check if user has already set up a Master PIN
  useEffect(() => {
    try {
      const pinHash = localStorage.getItem('buddio_vault_pin_hash');
      setHasMasterPin(!!pinHash);

      const saved = localStorage.getItem('buddio_secret_vault');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      setHasMasterPin(false);
    }
  }, []);

  const saveItems = (newItems: VaultItem[]) => {
    setItems(newItems);
    localStorage.setItem('buddio_secret_vault', JSON.stringify(newItems));
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4) {
      toast.error('Master PIN must be at least 4 characters');
      return;
    }
    if (pinInput !== confirmPinInput) {
      toast.error('PINs do not match. Please re-enter.');
      return;
    }

    const hashed = await hashPin(pinInput);
    localStorage.setItem('buddio_vault_pin_hash', hashed);
    setHasMasterPin(true);
    setMasterPin(pinInput);
    setIsUnlocked(true);
    setPinInput('');
    setConfirmPinInput('');
    toast.success('Master PIN created & Vault Unlocked!');
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    const storedHash = localStorage.getItem('buddio_vault_pin_hash');
    const inputHash = await hashPin(pinInput);

    if (storedHash && inputHash !== storedHash) {
      toast.error('Incorrect PIN! Access denied.');
      setPinInput('');
      return;
    }

    setMasterPin(pinInput);
    setIsUnlocked(true);
    setPinInput('');
    toast.success('Secret Vault Unlocked with AES-256');
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setMasterPin('');
    setDecryptedCache({});
    setRevealedIds({});
    toast.info('Vault Locked');
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || !itemSecret.trim()) return;

    try {
      const { ciphertext, iv } = await encryptSecret(itemSecret, masterPin);
      const newItem: VaultItem = {
        id: crypto.randomUUID(),
        title: itemTitle.trim(),
        category: itemCategory,
        ciphertext,
        iv,
        createdAt: new Date().toISOString(),
      };

      const updated = [newItem, ...items];
      saveItems(updated);
      setAddModal(false);
      setItemTitle('');
      setItemSecret('');
      toast.success('Secret encrypted & stored safely');
    } catch {
      toast.error('Encryption failed');
    }
  };

  const toggleReveal = async (item: VaultItem) => {
    if (revealedIds[item.id]) {
      setRevealedIds((prev) => ({ ...prev, [item.id]: false }));
      return;
    }

    try {
      if (!decryptedCache[item.id]) {
        const plaintext = await decryptSecret(item.ciphertext, item.iv, masterPin);
        setDecryptedCache((prev) => ({ ...prev, [item.id]: plaintext }));
      }
      setRevealedIds((prev) => ({ ...prev, [item.id]: true }));
    } catch {
      toast.error('Incorrect PIN or corrupted data');
    }
  };

  const copySecret = async (item: VaultItem) => {
    try {
      let plaintext = decryptedCache[item.id];
      if (!plaintext) {
        plaintext = await decryptSecret(item.ciphertext, item.iv, masterPin);
        setDecryptedCache((prev) => ({ ...prev, [item.id]: plaintext }));
      }
      await navigator.clipboard.writeText(plaintext);
      toast.success('Decrypted secret copied to clipboard');
    } catch {
      toast.error('Failed to decrypt secret');
    }
  };

  const deleteItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    saveItems(updated);
    toast.success('Secret removed');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Zero-Knowledge Security"
        title="Encrypted Secret Vault"
        description="Client-side AES-256-GCM encrypted storage for recovery keys, passwords, server secrets, and private diary entries."
        action={
          isUnlocked ? (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setAddModal(true)} className="gap-2">
                <Plus size={16} /> Store Secret
              </Button>
              <Button size="sm" variant="outline" onClick={handleLock} className="gap-2 border-rose-500/30 text-rose-300">
                <Lock size={15} /> Lock Vault
              </Button>
            </div>
          ) : null
        }
      />

      {!isUnlocked ? (
        <GlassCard className="max-w-md mx-auto py-10 px-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500/20 to-purple-500/20 text-sky-400 border border-sky-500/30 shadow-lg">
            <KeyRound size={26} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground">
              {hasMasterPin ? 'Unlock Private Vault' : 'Set Up Vault Master PIN'}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {hasMasterPin
                ? 'Enter your verified Master PIN to decrypt your vault items with AES-256.'
                : 'Create a private Master PIN to protect your secret vault. Keep it safe — it cannot be reset.'}
            </p>
          </div>

          {hasMasterPin ? (
            <form onSubmit={handleUnlock} className="space-y-3 pt-2">
              <input
                type="password"
                required
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter Master PIN..."
                className="w-full text-center tracking-widest text-base rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
              />

              <Button type="submit" className="w-full gap-2">
                <Unlock size={15} /> Unlock Secrets
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSetupPin} className="space-y-3 pt-2">
              <input
                type="password"
                required
                autoFocus
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Create Master PIN (min 4 chars)..."
                className="w-full text-center tracking-widest text-sm rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
              />

              <input
                type="password"
                required
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value)}
                placeholder="Confirm Master PIN..."
                className="w-full text-center tracking-widest text-sm rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
              />

              <Button type="submit" className="w-full gap-2">
                <ShieldCheck size={15} /> Initialize & Secure Vault
              </Button>
            </form>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80 pt-2 border-t border-white/5">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>End-to-End Client Encrypted</span>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <FolderLock size={15} className="text-sky-400" />
              <span>{items.length} Stored Encrypted Items</span>
            </div>
          </div>

          {items.length === 0 ? (
            <GlassCard className="text-center py-12">
              <FileKey className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h4 className="mt-3 text-sm font-semibold text-foreground">Your Vault is Empty</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
                Safely store API tokens, master passwords, or private notes here.
              </p>
              <Button size="sm" onClick={() => setAddModal(true)} className="mt-4 gap-1.5 text-xs">
                <Plus size={14} /> Add First Secret
              </Button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const isRevealed = !!revealedIds[item.id];
                const decryptedValue = decryptedCache[item.id] || '••••••••••••••••';
                return (
                  <GlassCard key={item.id} className="p-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</h4>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold text-sky-300">
                          {item.category}
                        </span>
                      </div>

                      <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-2.5 font-mono text-xs break-all select-all text-foreground">
                        {isRevealed ? decryptedValue : '••••••••••••••••'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleReveal(item)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition"
                          title={isRevealed ? 'Hide secret' : 'Reveal secret'}
                        >
                          {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => copySecret(item)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition"
                          title="Copy decrypted secret"
                        >
                          <Copy size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="rounded-lg p-1.5 text-muted-foreground/60 hover:text-rose-400 transition"
                        title="Delete from vault"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Secret Modal */}
      <FormModal open={addModal} onOpenChange={setAddModal} title="Store Encrypted Secret" description="Your secret is encrypted in your browser before saving.">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title / Label</label>
            <input
              type="text"
              required
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              placeholder="e.g. Production Database Password, Crypto Recovery Key"
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-xs focus:outline-none"
            >
              <option value="PASSWORD">Password / Credential</option>
              <option value="KEY">API Key / Token</option>
              <option value="NOTE">Private Note / Diary</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Secret Value / Content</label>
            <textarea
              required
              rows={4}
              value={itemSecret}
              onChange={(e) => setItemSecret(e.target.value)}
              placeholder="Paste password, secret key, or private note..."
              className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!itemTitle.trim() || !itemSecret.trim()}>
              Encrypt & Store
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
