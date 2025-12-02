import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

const CONTRACT_ADDRESS = '0x33033b2D6E540585a75f744e605F2E9406Be2910';

const CONTRACT_ABI = [
  "function createJob(string memory _description) external payable",
  "function submitBid(uint256 _jobId, uint256 _bidAmount) external",
  "function acceptBid(uint256 _jobId, address _freelancer, uint256 _bidAmount) external",
  "function submitDeliverable(uint256 _jobId, string memory _uri) external",
  "function releasePayment(uint256 _jobId, uint256 _score) external",
  "function raiseDispute(uint256 _jobId) external",
  "function stakeAsJuror() external payable",
  "function withdrawStake() external",
  "function selectJurors(uint256 _disputeId) external",
  "function voteOnDispute(uint256 _disputeId, bool _inFavor) external",
  "function cancelJob(uint256 _jobId) external",
  "function jobs(uint256) external view returns (uint256, address, string, uint256, uint8, address, uint256, string, uint256)",
  "function disputes(uint256) external view returns (uint256, address, address, uint256, uint256, uint256, uint256, bool, bool)",
  "function disputeJurors(uint256, uint256) external view returns (address, uint256, bool, bool)",
  "function jurorStakes(address) external view returns (uint256)",
  "function jobCounter() external view returns (uint256)",
  "function disputeCounter() external view returns (uint256)",
  "function getBidCount(uint256 _jobId) external view returns (uint256)",
  "function getAllBids(uint256 _jobId) external view returns (tuple(address freelancer, uint256 amount, uint256 timestamp)[])",
  "event JobCreated(uint256 indexed jobId, address client, uint256 budget)",
  "event BidSubmitted(uint256 indexed jobId, address freelancer, uint256 amount)",
  "event BidAccepted(uint256 indexed jobId, address freelancer)",
  "event DeliverableSubmitted(uint256 indexed jobId, string uri)",
  "event PaymentReleased(uint256 indexed jobId, uint256 amount)",
  "event DisputeRaised(uint256 indexed disputeId, uint256 jobId)",
  "event JurorsSelected(uint256 indexed disputeId, uint256 jurorCount)",
  "event JurorStaked(address indexed juror, uint256 amount)",
  "event JurorVoted(uint256 indexed disputeId, address juror, bool inFavor)",
  "event DisputeResolved(uint256 indexed disputeId, bool freelancerWon)",
  "event StakeSlashed(address indexed juror, uint256 amount)",
  "event StakeWithdrawn(address indexed juror, uint256 amount)",
  "event ReputationMinted(address freelancer, uint256 tokenId, uint256 score)"
];

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        setProvider(provider);
        setAccount(address);
        setContract(contract);
        
        // Store connection status in localStorage
        localStorage.setItem('walletConnected', 'true');
      } catch (error) {
        console.error('Error connecting wallet:', error);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Check if wallet was previously connected and auto-connect
  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined' && localStorage.getItem('walletConnected') === 'true') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
          
          setProvider(provider);
          setAccount(address);
          setContract(contract);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        localStorage.removeItem('walletConnected');
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    localStorage.removeItem('walletConnected');
  };

  useEffect(() => {
    // Check for existing connection on component mount
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const value = {
    account,
    provider,
    contract,
    loading,
    connectWallet,
    disconnectWallet,
    CONTRACT_ADDRESS
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};