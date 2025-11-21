// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Interface for Reputation NFT
interface IReputationNFT {
    function mintReputation(
        address to,
        uint256 score
    ) external returns (uint256);
}

contract FairLance is ReentrancyGuard, Ownable {
    IReputationNFT public reputationNFT;

    enum JobStatus {
        Open,
        InProgress,
        Completed,
        Disputed,
        Resolved
    }

    struct Bid {
        address freelancer;
        uint256 amount;
        uint256 timestamp;
    }

    struct Job {
        uint256 id;
        address client;
        string description;
        uint256 budget;
        JobStatus status;
        address freelancer;
        uint256 bidAmount;
        string deliverableURI;
        uint256 reputationScore;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Bid[]) public jobBids; // NEW: All bids visible
    uint256 public jobCounter;

    // DAO Voting
    mapping(uint256 => mapping(address => bool)) public votes;
    mapping(uint256 => uint256) public voteCountFor;
    mapping(uint256 => uint256) public voteCountAgainst;

    // Events
    event JobCreated(uint256 indexed jobId, address client, uint256 budget);
    event BidSubmitted(
        uint256 indexed jobId,
        address freelancer,
        uint256 amount
    );
    event BidAccepted(uint256 indexed jobId, address freelancer);
    event DeliverableSubmitted(uint256 indexed jobId, string uri);
    event PaymentReleased(uint256 indexed jobId, uint256 amount);
    event DisputeRaised(uint256 indexed jobId);
    event DisputeResolved(uint256 indexed jobId, bool freelancerWon);
    event ReputationMinted(address freelancer, uint256 tokenId, uint256 score);

    constructor(address _reputationNFT) Ownable(msg.sender) {
        reputationNFT = IReputationNFT(_reputationNFT);
    }

    // Create Job
    function createJob(
        string memory _description
    ) external payable nonReentrant {
        require(msg.value > 0, "Budget > 0");
        jobCounter++;
        jobs[jobCounter] = Job({
            id: jobCounter,
            client: msg.sender,
            description: _description,
            budget: msg.value,
            status: JobStatus.Open,
            freelancer: address(0),
            bidAmount: 0,
            deliverableURI: "",
            reputationScore: 0
        });
        emit JobCreated(jobCounter, msg.sender, msg.value);
    }

    // Submit Bid (Now stored on-chain)
    function submitBid(uint256 _jobId, uint256 _bidAmount) external {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Open, "Job not open");
        require(_bidAmount <= job.budget, "Bid too high");

        jobBids[_jobId].push(
            Bid({
                freelancer: msg.sender,
                amount: _bidAmount,
                timestamp: block.timestamp
            })
        );

        emit BidSubmitted(_jobId, msg.sender, _bidAmount);
    }

    // Accept Bid
    function acceptBid(
        uint256 _jobId,
        address _freelancer,
        uint256 _bidAmount
    ) external nonReentrant {
        Job storage job = jobs[_jobId];
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.Open, "Not open");
        job.freelancer = _freelancer;
        job.bidAmount = _bidAmount;
        job.status = JobStatus.InProgress;
        emit BidAccepted(_jobId, _freelancer);
    }

    // Submit Deliverable
    function submitDeliverable(uint256 _jobId, string memory _uri) external {
        Job storage job = jobs[_jobId];
        require(msg.sender == job.freelancer, "Only freelancer");
        require(job.status == JobStatus.InProgress, "Not in progress");
        job.deliverableURI = _uri;
        job.status = JobStatus.Completed;
        emit DeliverableSubmitted(_jobId, _uri);
    }

    // Release Payment + Mint NFT (SAFE & FINAL)
    function releasePayment(
        uint256 _jobId,
        uint256 _score
    ) external nonReentrant {
        Job storage job = jobs[_jobId];
        require(msg.sender == job.client, "Only client");
        require(
            job.status == JobStatus.Completed ||
                job.status == JobStatus.Resolved,
            "Not completed"
        );
        require(_score >= 1 && _score <= 5, "Score 1-5");
        require(job.freelancer != address(0), "No freelancer");
        require(job.bidAmount > 0, "No bid amount");
        require(address(this).balance >= job.bidAmount, "Insufficient funds");

        // Transfer ETH
        payable(job.freelancer).transfer(job.bidAmount);
        job.reputationScore = _score;
        emit PaymentReleased(_jobId, job.bidAmount);

        // Mint Reputation NFT
        uint256 tokenId = reputationNFT.mintReputation(job.freelancer, _score);
        emit ReputationMinted(job.freelancer, tokenId, _score);
    }

    // DAO Dispute Flow
    function raiseDispute(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.Completed, "Must be completed");
        job.status = JobStatus.Disputed;
        emit DisputeRaised(_jobId);
    }

    function voteOnDispute(uint256 _jobId, bool _inFavorOfFreelancer) external {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Disputed, "Not disputed");
        require(!votes[_jobId][msg.sender], "Already voted");

        votes[_jobId][msg.sender] = true;
        if (_inFavorOfFreelancer) {
            voteCountFor[_jobId]++;
        } else {
            voteCountAgainst[_jobId]++;
        }

        // Auto-resolve after 3 votes
        if (voteCountFor[_jobId] + voteCountAgainst[_jobId] >= 3) {
            bool freelancerWon = voteCountFor[_jobId] >
                voteCountAgainst[_jobId];
            job.status = JobStatus.Resolved;

            if (!freelancerWon) {
                payable(job.client).transfer(job.bidAmount); // Refund client
            }
            emit DisputeResolved(_jobId, freelancerWon);
        }
    }

    // Cancel Job (before acceptance)
    function cancelJob(uint256 _jobId) external nonReentrant {
        Job storage job = jobs[_jobId];
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.Open, "Not open");
        payable(job.client).transfer(job.budget);
        delete jobs[_jobId];
    }

    // View Functions (for Remix & Frontend)
    function getBidCount(uint256 _jobId) public view returns (uint256) {
        return jobBids[_jobId].length;
    }

    function getAllBids(uint256 _jobId) public view returns (Bid[] memory) {
        return jobBids[_jobId];
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
