import type { WalletTransaction, WalletTransactionType } from '../types';
import { createUniqueId } from '../utils/id';

export interface WalletState {
  balance: number;
  transactions: WalletTransaction[];
}

export interface WalletOperationResult {
  ok: boolean;
  wallet: WalletState;
  error?: string;
}

export function createInitialWallet(): WalletState {
  return {
    balance: 0,
    transactions: [],
  };
}

export function creditWallet(
  wallet: WalletState,
  amount: number,
  description: string,
  meta?: {
    type?: WalletTransactionType;
    relatedCommissionId?: string;
    relatedItemId?: string;
    timestamp?: string;
  }
): WalletOperationResult {
  if (!Number.isFinite(amount) || amount < 0) {
    return {
      ok: false,
      wallet,
      error: 'Credit amount must be a non-negative number.',
    };
  }
  const roundedAmount = Math.round(amount);
  const nextBalance = wallet.balance + roundedAmount;
  const tx: WalletTransaction = {
    id: createUniqueId('tx'),
    type: meta?.type ?? 'commission_payment',
    amount: roundedAmount,
    balanceAfter: nextBalance,
    timestamp: meta?.timestamp ?? new Date().toISOString(),
    description,
    relatedCommissionId: meta?.relatedCommissionId,
    relatedItemId: meta?.relatedItemId,
  };

  return {
    ok: true,
    wallet: {
      balance: nextBalance,
      transactions: [tx, ...wallet.transactions],
    },
  };
}

export function debitWallet(
  wallet: WalletState,
  amount: number,
  description: string,
  meta?: {
    type?: WalletTransactionType;
    relatedItemId?: string;
    timestamp?: string;
  }
): WalletOperationResult {
  if (!Number.isFinite(amount) || amount < 0) {
    return {
      ok: false,
      wallet,
      error: 'Debit amount must be a non-negative number.',
    };
  }
  const roundedAmount = Math.round(amount);
  if (wallet.balance - roundedAmount < 0) {
    return {
      ok: false,
      wallet,
      error: `Not enough personal coins. Need ${roundedAmount} coins, balance is ${wallet.balance}.`,
    };
  }
  const nextBalance = wallet.balance - roundedAmount;
  const tx: WalletTransaction = {
    id: createUniqueId('tx'),
    type: meta?.type ?? 'shop_purchase',
    amount: -roundedAmount,
    balanceAfter: nextBalance,
    timestamp: meta?.timestamp ?? new Date().toISOString(),
    description,
    relatedItemId: meta?.relatedItemId,
  };

  return {
    ok: true,
    wallet: {
      balance: nextBalance,
      transactions: [tx, ...wallet.transactions],
    },
  };
}

export function adjustWallet(
  wallet: WalletState,
  delta: number,
  reason: string,
  timestamp?: string
): WalletOperationResult {
  if (!Number.isFinite(delta) || delta === 0) {
    return {
      ok: false,
      wallet,
      error: 'Adjustment amount must be a non-zero number.',
    };
  }
  const roundedDelta = Math.round(delta);
  const nextBalance = wallet.balance + roundedDelta;
  if (nextBalance < 0) {
    return {
      ok: false,
      wallet,
      error: `Cannot reduce balance below 0 (current balance: ${wallet.balance}).`,
    };
  }
  const tx: WalletTransaction = {
    id: createUniqueId('tx'),
    type: 'teacher_adjustment',
    amount: roundedDelta,
    balanceAfter: nextBalance,
    timestamp: timestamp ?? new Date().toISOString(),
    description: reason.trim() || 'Teacher wallet adjustment',
  };

  return {
    ok: true,
    wallet: {
      balance: nextBalance,
      transactions: [tx, ...wallet.transactions],
    },
  };
}
