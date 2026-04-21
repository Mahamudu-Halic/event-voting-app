"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"

interface BalanceCardProps {
  balance: number
  totalEarned: number
  totalWithdrawn: number
  onWithdrawClick: () => void
}

const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY === "GHS" ? "₵" : "₦"

export function BalanceCard({ balance, totalEarned, totalWithdrawn, onWithdrawClick }: BalanceCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Available Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
      >
        <Card className="bg-gradient-to-br from-gold-primary/20 to-gold-dark/20 border-gold-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <Wallet className="h-4 w-4 text-gold-primary" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-text-primary mb-2">
              {CURRENCY_SYMBOL}{balance.toFixed(2)}
            </div>
            <Button
              onClick={onWithdrawClick}
              disabled={balance < 10}
              className="w-full bg-gold-primary text-text-tertiary hover:bg-gold-dark"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
            {balance < 10 && (
              <p className="text-xs text-text-secondary mt-2 text-center">
                Minimum ₵10.00 to withdraw
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Total Earned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-purple-surface border-purple-accent/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {CURRENCY_SYMBOL}{totalEarned.toFixed(2)}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Lifetime earnings from votes
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Total Withdrawn */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-purple-surface border-purple-accent/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-purple-accent" />
              Total Withdrawn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-accent">
              {CURRENCY_SYMBOL}{totalWithdrawn.toFixed(2)}
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Lifetime withdrawals
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
