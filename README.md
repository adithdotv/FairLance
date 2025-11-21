# FAIRLANCE - Decentralized Freelance Marketplace

A React.js frontend for the decentralized freelance marketplace built on Ethereum blockchain.

## Features

- **Decentralized Job Marketplace**: Post and browse jobs without intermediaries
- **Smart Contract Escrow**: Secure payments held in blockchain escrow
- **Reputation NFTs**: Blockchain-verified reputation system
- **DAO Governance**: Community-driven dispute resolution
- **Web3 Integration**: Connect with MetaMask and other Web3 wallets

## Contract Address

The FairLance smart contract is deployed at:
`0x6021884Fc18248Dabdf8737123738fEcef94B8cA`

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MetaMask or compatible Web3 wallet
- Access to Ethereum testnet/mainnet

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Connect Wallet**: Click "Connect Wallet" to connect your MetaMask
2. **Browse Jobs**: View available jobs on the Jobs page
3. **Post Jobs**: Create new jobs with ETH escrow on the Create Job page
4. **Submit Bids**: Freelancers can bid on open jobs
5. **Manage Work**: Track progress on the My Jobs page
6. **Complete & Rate**: Release payments and mint reputation NFTs

## Smart Contract Functions

### For Clients
- `createJob(description)` - Post a new job with ETH escrow
- `acceptBid(jobId, freelancer, bidAmount)` - Accept a freelancer's bid
- `releasePayment(jobId, score)` - Release payment and rate freelancer
- `raiseDispute(jobId)` - Initiate dispute resolution
- `cancelJob(jobId)` - Cancel open job and refund escrow

### For Freelancers
- `submitBid(jobId, bidAmount)` - Submit bid for a job
- `submitDeliverable(jobId, uri)` - Submit completed work
- `voteOnDispute(jobId, inFavor)` - Vote on disputed jobs

## Job Lifecycle

1. **Open** - Client posts job, freelancers can bid
2. **In Progress** - Client accepts bid, freelancer works
3. **Completed** - Freelancer submits deliverable
4. **Disputed** - Client raises dispute (optional)
5. **Resolved** - Payment released, reputation NFT minted

## Technology Stack

- **Frontend**: React.js, Material-UI, React Router
- **Blockchain**: Ethereum, Solidity Smart Contracts
- **Web3**: ethers.js for blockchain interaction
- **Wallet**: MetaMask integration

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Navbar.js       # Navigation bar with wallet connection
├── contexts/           # React contexts
│   └── Web3Context.js  # Web3 provider and contract interaction
├── pages/              # Main application pages
│   ├── Home.js         # Landing page
│   ├── Jobs.js         # Browse and bid on jobs
│   ├── CreateJob.js    # Post new jobs
│   ├── MyJobs.js       # Manage posted/accepted jobs
│   └── Profile.js      # User profile and statistics
├── App.js              # Main application component
└── index.js            # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details