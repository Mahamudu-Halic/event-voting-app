"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAccount,
  getWithdrawals,
  type Account,
  type Withdrawal,
} from "@/apis/withdrawals";
import { BalanceCard } from "@/components/withdrawals/balance-card";
import { WithdrawalForm } from "@/components/withdrawals/withdrawal-form";
import { WithdrawalHistory } from "@/components/withdrawals/withdrawal-history";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, Plus, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function WithdrawalsPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [accountData, withdrawalsData] = await Promise.all([
        getAccount(),
        getWithdrawals(),
      ]);
      setAccount(accountData);
      setWithdrawals(withdrawalsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWithdrawalSuccess = () => {
    setShowForm(false);
    loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="bg-error/10 border-error/30">
          <CardContent className="p-6 text-center">
            <p className="text-error mb-4">{error}</p>
            <Button onClick={loadData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="bg-purple-surface border-purple-accent/30 max-w-md">
          <CardContent className="p-6 text-center">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-text-secondary" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Account Not Found
            </h2>
            <p className="text-text-secondary mb-4">
              Your organizer account hasn&apos;t been created yet. This usually
              happens automatically when you create your first event.
            </p>
            <Button
              asChild
              className="bg-gold-primary text-text-tertiary hover:bg-gold-dark"
            >
              <Link href="/organizer/events/new">Create an Event</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
          Withdrawals
        </h1>
        <p className="text-text-secondary">
          Manage your earnings and withdrawal requests
        </p>
      </div>

      {/* Balance Cards */}
      <BalanceCard
        balance={account.balance}
        totalEarned={account.totalEarned}
        totalWithdrawn={account.totalWithdrawn}
        onWithdrawClick={() => setShowForm(true)}
      />

      {/* Withdrawal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <WithdrawalForm
              maxAmount={account.balance}
              onSuccess={handleWithdrawalSuccess}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Withdraw Button (when form is hidden) */}
      {!showForm && account.balance >= 10 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-end"
        >
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gold-primary text-text-tertiary hover:bg-gold-dark"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Withdrawal
          </Button>
        </motion.div>
      )}

      {/* Withdrawal History */}
      <WithdrawalHistory withdrawals={withdrawals} onUpdate={loadData} />
    </div>
  );
}
