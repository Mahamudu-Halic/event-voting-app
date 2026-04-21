'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import { getPendingWithdrawals, updateWithdrawalStatus, type Withdrawal, type WithdrawalStatus } from '@/apis/withdrawals'
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  User,
  Calendar,
  CreditCard,
  Eye,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  failed: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

const statusIcons = {
  pending: Clock,
  processing: AlertCircle,
  completed: CheckCircle,
  failed: XCircle,
  cancelled: XCircle
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'all'>('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [transactionReference, setTransactionReference] = useState('')
  const [failureReason, setFailureReason] = useState('')

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      const data = await getPendingWithdrawals()
      setWithdrawals(data)
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (withdrawalId: string, newStatus: WithdrawalStatus) => {
    setProcessingAction(withdrawalId)
    try {
      const result = await updateWithdrawalStatus(
        withdrawalId,
        newStatus,
        transactionReference || undefined,
        failureReason || undefined
      )
      
      if (result.success) {
        // Refresh the list
        await fetchWithdrawals()
        // Close dialog and reset form
        setSelectedWithdrawal(null)
        setTransactionReference('')
        setFailureReason('')
      }
    } catch (error) {
      console.error('Error updating withdrawal status:', error)
    } finally {
      setProcessingAction(null)
    }
  }

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-14 h-14 rounded-xl bg-linear-to-br from-gold-primary/30 to-amber-500/30 flex items-center justify-center border border-gold-primary/30"
          >
            <DollarSign className="h-7 w-7 text-gold-primary" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">
              Withdrawal Management
            </h1>
            <p className="text-text-secondary mt-1">
              Review and process withdrawal requests from organizers
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-gold-primary/20 text-gold-primary border-gold-primary/30 px-4 py-1.5 text-sm font-medium w-fit"
        >
          {withdrawals.filter(w => w.status === 'pending').length} Pending
        </Badge>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] as const }}
      >
        <Card className="bg-purple-surface/80 backdrop-blur-sm border-purple-accent/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <Input
                    placeholder="Search by phone, account name, or number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-purple-bg/50 border-purple-accent/30 text-text-primary placeholder-text-secondary"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as WithdrawalStatus | 'all')}>
                  <SelectTrigger className="bg-purple-bg/50 border-purple-accent/30 text-text-primary">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Withdrawals List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {filteredWithdrawals.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="bg-purple-surface/80 backdrop-blur-sm border-purple-accent/30">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-bg/50 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-text-secondary" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">No withdrawal requests found</h3>
                <p className="text-text-secondary">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters or search terms'
                    : 'When organizers request withdrawals, they will appear here'
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          filteredWithdrawals.map((withdrawal) => {
            const StatusIcon = statusIcons[withdrawal.status]
            return (
              <motion.div key={withdrawal.id} variants={itemVariants}>
                <Card className="bg-purple-surface/80 backdrop-blur-sm border-purple-accent/30 hover:border-purple-accent/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Withdrawal Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-purple-bg/50 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-gold-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-text-primary">
                                ${withdrawal.amount.toFixed(2)}
                              </h3>
                              <Badge className={statusColors[withdrawal.status]}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {withdrawal.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-text-secondary">
                              Requested {format(new Date(withdrawal.createdAt), 'MMM dd, yyyy at h:mm a')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          {withdrawal.paymentMethod === 'mobile_money' ? (
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-text-secondary" />
                              <span className="text-text-secondary">Mobile Money:</span>
                              <span className="text-text-primary font-medium">{withdrawal.phoneNumber}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-text-secondary" />
                                <span className="text-text-secondary">Account:</span>
                                <span className="text-text-primary font-medium">{withdrawal.accountName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-text-secondary" />
                                <span className="text-text-primary font-medium">{withdrawal.accountNumber}</span>
                              </div>
                            </>
                          )}
                          {withdrawal.bankName && (
                            <div className="flex items-center gap-2">
                              <span className="text-text-secondary">Bank:</span>
                              <span className="text-text-primary font-medium">{withdrawal.bankName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-purple-accent text-text-primary hover:bg-purple-surface"
                              onClick={() => setSelectedWithdrawal(withdrawal)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-purple-surface border-purple-accent/30 max-w-md">
                            <DialogHeader>
                              <DialogTitle className="text-text-primary">Withdrawal Details</DialogTitle>
                              <DialogDescription className="text-text-secondary">
                                Review withdrawal request details and take action
                              </DialogDescription>
                            </DialogHeader>
                            {selectedWithdrawal && (
                              <div className="space-y-4">
                                <div className="bg-purple-bg/50 rounded-lg p-4 space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Amount:</span>
                                    <span className="text-text-primary font-semibold">${selectedWithdrawal.amount.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Status:</span>
                                    <Badge className={statusColors[selectedWithdrawal.status]}>
                                      {selectedWithdrawal.status}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Payment Method:</span>
                                    <span className="text-text-primary">{selectedWithdrawal.paymentMethod}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-text-secondary">Requested:</span>
                                    <span className="text-text-primary">
                                      {format(new Date(selectedWithdrawal.createdAt), 'MMM dd, yyyy h:mm a')}
                                    </span>
                                  </div>
                                </div>

                                {selectedWithdrawal.status === 'pending' && (
                                  <div className="space-y-3">
                                    <div>
                                      <Label htmlFor="reference" className="text-text-primary">Transaction Reference (if completed)</Label>
                                      <Input
                                        id="reference"
                                        value={transactionReference}
                                        onChange={(e) => setTransactionReference(e.target.value)}
                                        placeholder="Enter transaction reference"
                                        className="bg-purple-bg/50 border-purple-accent/30 text-text-primary"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="reason" className="text-text-primary">Failure Reason (if failed)</Label>
                                      <Textarea
                                        id="reason"
                                        value={failureReason}
                                        onChange={(e) => setFailureReason(e.target.value)}
                                        placeholder="Enter reason for failure"
                                        className="bg-purple-bg/50 border-purple-accent/30 text-text-primary"
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="flex gap-2 pt-4">
                                  {selectedWithdrawal.status === 'pending' && (
                                    <>
                                      <Button
                                        onClick={() => handleStatusUpdate(selectedWithdrawal.id, 'processing')}
                                        disabled={processingAction === selectedWithdrawal.id}
                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                      >
                                        {processingAction === selectedWithdrawal.id ? 'Processing...' : 'Mark Processing'}
                                      </Button>
                                      <Button
                                        onClick={() => handleStatusUpdate(selectedWithdrawal.id, 'completed')}
                                        disabled={processingAction === selectedWithdrawal.id}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                      >
                                        {processingAction === selectedWithdrawal.id ? 'Processing...' : 'Approve'}
                                      </Button>
                                      <Button
                                        onClick={() => handleStatusUpdate(selectedWithdrawal.id, 'failed')}
                                        disabled={processingAction === selectedWithdrawal.id}
                                        variant="destructive"
                                      >
                                        {processingAction === selectedWithdrawal.id ? 'Processing...' : 'Reject'}
                                      </Button>
                                    </>
                                  )}
                                  {selectedWithdrawal.status === 'processing' && (
                                    <>
                                      <Button
                                        onClick={() => handleStatusUpdate(selectedWithdrawal.id, 'completed')}
                                        disabled={processingAction === selectedWithdrawal.id}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                      >
                                        {processingAction === selectedWithdrawal.id ? 'Processing...' : 'Mark Completed'}
                                      </Button>
                                      <Button
                                        onClick={() => handleStatusUpdate(selectedWithdrawal.id, 'failed')}
                                        disabled={processingAction === selectedWithdrawal.id}
                                        variant="destructive"
                                      >
                                        {processingAction === selectedWithdrawal.id ? 'Processing...' : 'Mark Failed'}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })
        )}
      </motion.div>
    </div>
  )
}
