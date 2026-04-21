"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Smartphone,
  Building2,
  AlertCircle,
  MoreHorizontal
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cancelWithdrawal, type Withdrawal } from "@/apis/withdrawals"

interface WithdrawalHistoryProps {
  withdrawals: Withdrawal[]
  onUpdate: () => void
}

const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY === "GHS" ? "₵" : "₦"

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="bg-warning/10 border-warning/30 text-warning">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    case "processing":
      return (
        <Badge variant="outline" className="bg-purple-accent/10 border-purple-accent/30 text-purple-accent">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      )
    case "completed":
      return (
        <Badge variant="outline" className="bg-success/10 border-success/30 text-success">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="outline" className="bg-error/10 border-error/30 text-error">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    case "cancelled":
      return (
        <Badge variant="outline" className="bg-text-secondary/10 border-text-secondary/30 text-text-secondary">
          <AlertCircle className="h-3 w-3 mr-1" />
          Cancelled
        </Badge>
      )
    default:
      return null
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function WithdrawalItem({ withdrawal, onUpdate }: { withdrawal: Withdrawal; onUpdate: () => void }) {
  const [isCancelling, setIsCancelling] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this withdrawal? The amount will be refunded to your balance.")) {
      return
    }

    setIsCancelling(true)
    try {
      const result = await cancelWithdrawal(withdrawal.id)
      if (result.success) {
        onUpdate()
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert("Failed to cancel withdrawal")
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-b border-purple-accent/20 last:border-0 pb-4 last:pb-0"
    >
      <div className="flex items-start justify-between py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusBadge(withdrawal.status)}
            <span className="text-sm text-text-secondary">
              {formatDate(withdrawal.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-primary">
            <span className="font-semibold text-lg">
              {CURRENCY_SYMBOL}{withdrawal.amount.toFixed(2)}
            </span>
            {withdrawal.paymentMethod === "mobile_money" ? (
              <span className="flex items-center gap-1 text-sm text-text-secondary">
                <Smartphone className="h-3.5 w-3.5" />
                Mobile Money
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-text-secondary">
                <Building2 className="h-3.5 w-3.5" />
                Bank Transfer
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {withdrawal.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isCancelling}
              className="border-error/30 text-error hover:bg-error/10"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Cancel"
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-text-secondary"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-purple-bg rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Reference ID</span>
                <span className="text-text-primary font-mono">{withdrawal.id.slice(0, 8)}...</span>
              </div>
              
              {withdrawal.paymentMethod === "mobile_money" && withdrawal.phoneNumber && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Phone Number</span>
                  <span className="text-text-primary">{withdrawal.phoneNumber}</span>
                </div>
              )}
              
              {withdrawal.paymentMethod === "bank_transfer" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Account Name</span>
                    <span className="text-text-primary">{withdrawal.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Account Number</span>
                    <span className="text-text-primary">{withdrawal.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Bank</span>
                    <span className="text-text-primary">{withdrawal.bankName}</span>
                  </div>
                </>
              )}

              {withdrawal.transactionReference && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Transaction Ref</span>
                  <span className="text-text-primary font-mono">{withdrawal.transactionReference}</span>
                </div>
              )}

              {withdrawal.processedAt && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Processed</span>
                  <span className="text-text-primary">{formatDate(withdrawal.processedAt)}</span>
                </div>
              )}

              {withdrawal.failureReason && (
                <div className="p-2 bg-error/10 rounded text-error text-xs">
                  Failure reason: {withdrawal.failureReason}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function WithdrawalHistory({ withdrawals, onUpdate }: WithdrawalHistoryProps) {
  const [filter, setFilter] = useState<"all" | Withdrawal["status"]
>("all")

  const filteredWithdrawals = filter === "all" 
    ? withdrawals 
    : withdrawals.filter(w => w.status === filter)

  const statusCounts = {
    all: withdrawals.length,
    pending: withdrawals.filter(w => w.status === "pending").length,
    processing: withdrawals.filter(w => w.status === "processing").length,
    completed: withdrawals.filter(w => w.status === "completed").length,
    failed: withdrawals.filter(w => w.status === "failed").length,
    cancelled: withdrawals.filter(w => w.status === "cancelled").length,
  }

  return (
    <Card className="bg-purple-surface border-purple-accent/30">
      <CardHeader>
        <CardTitle className="text-text-primary text-lg flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-gold-primary" />
          Withdrawal History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "pending", "processing", "completed"] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className={
                filter === status
                  ? "bg-gold-primary text-text-tertiary hover:bg-gold-dark"
                  : "border-purple-accent text-text-secondary hover:bg-purple-accent/10"
              }
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {statusCounts[status] > 0 && (
                <span className="ml-1.5 text-xs bg-purple-bg px-1.5 py-0.5 rounded-full">
                  {statusCounts[status]}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Withdrawals List */}
        {filteredWithdrawals.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No {filter !== "all" ? filter : ""} withdrawals found</p>
          </div>
        ) : (
          <div className="space-y-0">
            <AnimatePresence>
              {filteredWithdrawals.map((withdrawal) => (
                <WithdrawalItem 
                  key={withdrawal.id} 
                  withdrawal={withdrawal} 
                  onUpdate={onUpdate}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
