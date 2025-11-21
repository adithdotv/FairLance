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

const CONTRACT_ADDRESS = '0xFBf1E3155993C875ada5DE443F093ef75a950bBb';

const CONTRACT_ABI = [
  "function createJob(string memory _description) external payable",
  "function submitBid(uint256 _jobId, uint256 _bidAmount) external",
  "function acceptBid(uint256 _jobId, address _freelancer, uint256 _bidAmount) external",
  "function submitDeliverable(uint256 _jobId, string memory _uri) external",
  "function releasePayment(uint256 _jobId, uint256 _score) external",
  "function raiseDispute(uint256 _jobId) external",
  "function voteOnDispute(uint256 _jobId, bool _inFavor) external",
  "function cancelJob(uint256 _jobId) external",
  "function jobs(uint256) external view returns (uint256, address, string, uint256, uint8, address, uint256, string, uint256)",
  "function jobCounter() external view returns (uint256)",
  "function getBidCount(uint256 _jobId) external view returns (uint256)",
  "function getAllBids(uint256 _jobId) external view returns (tuple(address freelancer, uint256 amount, uint256 timestamp)[])",
  "event JobCreated(uint256 indexed jobId, address client, uint256 budget)",
  "event BidSubmitted(uint256 indexed jobId, address freelancer, uint256 amount)",
  "event BidAccepted(uint256 indexed jobId, address freelancer)",
  "event DeliverableSubmitted(uint256 indexed jobId, string uri)",
  "event PaymentReleased(uint256 indexed jobId, uint256 amount)",
  "event DisputeRaised(uint256 indexed jobId)",
  "event DisputeResolved(uint256 indexed jobId, bool freelancerWon)"
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
      } catch (error) {
        console.error('Error connecting wallet:', error);
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
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