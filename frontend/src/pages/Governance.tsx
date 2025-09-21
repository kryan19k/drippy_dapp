import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Gavel, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  TrendingUp,
  Users
} from 'lucide-react'

const Governance: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active')

  const proposals = [
    {
      id: 1,
      title: 'Increase DRIPPY Rewards by 15%',
      description: 'Proposal to increase daily DRIPPY rewards for all stakers by 15% to attract more users to the platform.',
      status: 'active',
      votesFor: 1250,
      votesAgainst: 320,
      totalVotes: 1570,
      endDate: '2024-01-15',
      proposer: '0x1234...5678',
      category: 'Rewards'
    },
    {
      id: 2,
      title: 'Add New NFT Collection',
      description: 'Introduce a new series of Drippy NFTs with enhanced reward rates and unique traits.',
      status: 'passed',
      votesFor: 2100,
      votesAgainst: 450,
      totalVotes: 2550,
      endDate: '2024-01-10',
      proposer: '0x9876...5432',
      category: 'NFT'
    },
    {
      id: 3,
      title: 'Treasury Fund Allocation',
      description: 'Allocate 20% of treasury funds to marketing and community development initiatives.',
      status: 'rejected',
      votesFor: 800,
      votesAgainst: 1200,
      totalVotes: 2000,
      endDate: '2024-01-05',
      proposer: '0x4567...8901',
      category: 'Treasury'
    },
    {
      id: 4,
      title: 'Cross-Chain Bridge Integration',
      description: 'Integrate with other blockchain networks to enable cross-chain DRIPPY token transfers.',
      status: 'active',
      votesFor: 980,
      votesAgainst: 420,
      totalVotes: 1400,
      endDate: '2024-01-20',
      proposer: '0x2468...1357',
      category: 'Technical'
    }
  ]

  const stats = [
    {
      title: 'Total Proposals',
      value: '24',
      change: '+3 this month',
      icon: Gavel,
      color: 'text-blue-400'
    },
    {
      title: 'Active Votes',
      value: '2',
      change: 'Ending soon',
      icon: Clock,
      color: 'text-yellow-400'
    },
    {
      title: 'Participation Rate',
      value: '68%',
      change: '+5% from last month',
      icon: Users,
      color: 'text-green-400'
    },
    {
      title: 'Pass Rate',
      value: '75%',
      change: '+12% from last month',
      icon: TrendingUp,
      color: 'text-primary-400'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-yellow-400 bg-yellow-400/20'
      case 'passed': return 'text-green-400 bg-green-400/20'
      case 'rejected': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Clock
      case 'passed': return CheckCircle
      case 'rejected': return XCircle
      default: return Clock
    }
  }

  const filteredProposals = proposals.filter(proposal => {
    if (activeTab === 'all') return true
    return proposal.status === activeTab
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Governance</h1>
          <p className="text-muted-foreground mt-1">
            Participate in community decisions and shape the future of Drippy.
          </p>
        </div>
        <button className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>Create Proposal</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-elevated p-6 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 glass p-1 rounded-lg">
        {[
          { id: 'active', label: 'Active', count: proposals.filter(p => p.status === 'active').length },
          { id: 'passed', label: 'Passed', count: proposals.filter(p => p.status === 'passed').length },
          { id: 'rejected', label: 'Rejected', count: proposals.filter(p => p.status === 'rejected').length },
          { id: 'all', label: 'All', count: proposals.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center justify-center space-x-2">
              <span>{tab.label}</span>
              <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                {tab.count}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Proposals List */}
      <div className="space-y-6">
        {filteredProposals.map((proposal, index) => {
          const StatusIcon = getStatusIcon(proposal.status)
          const votePercentage = proposal.totalVotes > 0 
            ? (proposal.votesFor / proposal.totalVotes) * 100 
            : 0

          return (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-6 rounded-xl hover:shadow-drip transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">{proposal.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          {proposal.status}
                        </span>
                        <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-full text-xs">
                          {proposal.category}
                        </span>
                      </div>
                      <p className="text-gray-400 mb-4">{proposal.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Proposed by: {proposal.proposer}</span>
                        <span>•</span>
                        <span>Ends: {proposal.endDate}</span>
                      </div>
                    </div>
                    <StatusIcon className={`w-6 h-6 ${getStatusColor(proposal.status).split(' ')[0]}`} />
                  </div>

                  {/* Vote Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Votes</span>
                      <span className="text-white font-medium">
                        {proposal.votesFor.toLocaleString()} / {proposal.totalVotes.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${votePercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="text-green-400">
                          For: {proposal.votesFor.toLocaleString()}
                        </span>
                        <span className="text-red-400">
                          Against: {proposal.votesAgainst.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-gray-400">
                        {votePercentage.toFixed(1)}% in favor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vote Buttons */}
                {proposal.status === 'active' && (
                  <div className="flex flex-col space-y-2 lg:ml-6">
                    <button className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                      Vote For
                    </button>
                    <button className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
                      Vote Against
                    </button>
                    <button className="px-6 py-2 glass text-gray-300 hover:text-white rounded-lg transition-colors">
                      View Details
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default Governance

