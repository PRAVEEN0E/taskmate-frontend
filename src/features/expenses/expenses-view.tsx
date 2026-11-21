'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { GlassCard, PageHeader, EmptyState, StatCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { FormModal } from '@/components/ui/dialog';
import { Plus, Wallet, ArrowDownRight, ArrowUpRight, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  kind: 'INCOME' | 'EXPENSE';
  amount: string;
  currency: string;
  method: string;
  memo: string;
  date: string;
  category?: { id: string; name: string } | null;
}

export function ExpensesView() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [kind, setKind] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [memo, setMemo] = useState('');

  // 1. Fetch Transactions
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['expenses'],
    queryFn: () => api<Transaction[]>('/expenses'),
  });

  // Create Transaction Mutation
  const createTxMutation = useMutation({
    mutationFn: (newTx: any) =>
      api('/expenses', {
        method: 'POST',
        body: JSON.stringify(newTx),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setModalOpen(false);
      setAmount('');
      setMemo('');
      toast.success('Transaction logged');
    },
  });

  // Delete Transaction
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/expenses/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Transaction removed');
    },
  });

  // Summaries
  const totalExpense = transactions
    .filter((t) => t.kind === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalIncome = transactions
    .filter((t) => t.kind === 'INCOME')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Personal Finance"
        title="Expense Tracker"
        description="Monitor cash flow, categorize payments, and manage monthly spending with exact decimal precision."
        action={
          <div className="flex gap-2">
            <a
              href="/api/v1/expenses/export.csv"
              download
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white/[0.04] px-3 py-2 text-xs font-medium text-foreground hover:bg-white/[0.08]"
            >
              <Download size={14} /> Export CSV
            </a>
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Plus size={16} /> Log Entry
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Spending"
          value={`₹${totalExpense.toLocaleString('en-IN')}`}
          detail="Recorded expense transactions"
          icon={<ArrowDownRight className="text-rose-400" size={18} />}
        />
        <StatCard
          title="Total Income"
          value={`₹${totalIncome.toLocaleString('en-IN')}`}
          detail="Recorded incoming cash flow"
          icon={<ArrowUpRight className="text-emerald-400" size={18} />}
        />
        <StatCard
          title="Net Cash Flow"
          value={`₹${(totalIncome - totalExpense).toLocaleString('en-IN')}`}
          detail="Surplus or deficit"
          icon={<Wallet className="text-sky-400" size={18} />}
        />
      </div>

      <GlassCard className="p-6">
        <h3 className="mb-4 text-base font-semibold">Transaction Ledger</h3>

        {transactions.length === 0 ? (
          <EmptyState title="No transactions" description="Log your expenses or income to view financial insights." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Memo / Purpose</th>
                  <th className="pb-3 font-medium">Payment Mode</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 text-right font-medium">Amount</th>
                  <th className="pb-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-medium">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] uppercase font-semibold ${
                          tx.kind === 'INCOME'
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-rose-500/10 text-rose-300'
                        }`}
                      >
                        {tx.kind}
                      </span>
                    </td>
                    <td className="py-3 text-foreground">{tx.memo || '—'}</td>
                    <td className="py-3 text-muted-foreground">{tx.method}</td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td
                      className={`py-3 text-right font-semibold ${
                        tx.kind === 'INCOME' ? 'text-emerald-400' : 'text-foreground'
                      }`}
                    >
                      {tx.kind === 'INCOME' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(tx.id)}
                        className="text-muted-foreground hover:text-rose-400 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Modal */}
      <FormModal open={modalOpen} onOpenChange={setModalOpen} title="Record Transaction" description="Add income or expense.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTxMutation.mutate({
              kind,
              amount,
              method,
              memo,
              date: new Date().toISOString(),
              currency: 'INR',
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount (INR)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Payment Mode</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="UPI">UPI</option>
                <option value="CARD">Credit/Debit Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Memo / Note</label>
              <input
                type="text"
                placeholder="e.g. AWS Cloud bill"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-black/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Log Transaction</Button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
