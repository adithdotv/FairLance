// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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

    struct Juror {
        address juror;
        uint256 stake;
        bool hasVoted;
        bool inFavor;
    }

    struct Dispute {
        uint256 jobId;
        address client;
        address freelancer;
        uint256 totalStake;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 jurorCount;
        bool resolved;
        bool freelancerWon;
        uint256 raisedAt;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Bid[]) public jobBids;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => Juror[]) public disputeJurors;
    mapping(address => uint256) public jurorStakes;
    address[] public jurorPool;
    uint256 public disputeCounter;
    uint256 public constant STAKE_AMOUNT = 0.01 ether;
    uint256 public constant JURORS_PER_DISPUTE = 3;

    uint256 public jobCounter;

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
    event DisputeRaised(uint256 indexed disputeId, uint256 jobId);
    event JurorsSelected(uint256 indexed disputeId, uint256 jurorCount);
    event JurorStaked(address indexed juror, uint256 amount);
    event JurorVoted(uint256 indexed disputeId, address juror, bool inFavor);
    event DisputeResolved(uint256 indexed disputeId, bool freelancerWon);
    event StakeSlashed(address indexed juror, uint256 amount);
    event StakeWithdrawn(address indexed juror, uint256 amount);
    event ReputationMinted(address freelancer, uint256 tokenId, uint256 score);

    constructor(address _reputationNFT) Ownable(msg.sender) {
        reputationNFT = IReputationNFT(_reputationNFT);
    }

    // Create Job
    function createJob(
        string memory _description
    ) external payable nonReentrant {
        require(msg.value > 0, "Budget must be > 0");
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

    // Submit Bid
    function submitBid(uint256 _jobId, uint256 _bidAmount) external {
        Job storage job = jobs[_jobId];
        require(job.id == _jobId, "Job does not exist");
        require(job.status == JobStatus.Open, "Job not open");
        require(
            _bidAmount <= job.budget && _bidAmount > 0,
            "Invalid bid amount"
        );

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
        require(job.id == _jobId, "Job does not exist");
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.Open, "Job not open");

        bool validBid = false;
        for (uint i = 0; i < jobBids[_jobId].length; i++) {
            if (
                jobBids[_jobId][i].freelancer == _freelancer &&
                jobBids[_jobId][i].amount == _bidAmount
            ) {
                validBid = true;
                break;
            }
        }
        require(validBid, "Bid not found");

        job.freelancer = _freelancer;
        job.bidAmount = _bidAmount;
        job.status = JobStatus.InProgress;
        emit BidAccepted(_jobId, _freelancer);
    }

    // Submit Deliverable
    function submitDeliverable(uint256 _jobId, string memory _uri) external {
        Job storage job = jobs[_jobId];
        require(job.id == _jobId, "Job does not exist");
        require(msg.sender == job.freelancer, "Only freelancer");
        require(job.status == JobStatus.InProgress, "Not in progress");
        job.deliverableURI = _uri;
        job.status = JobStatus.Completed;
        emit DeliverableSubmitted(_jobId, _uri);
    }

    // Release Payment (only when no dispute)
    function releasePayment(
        uint256 _jobId,
        uint256 _score
    ) external nonReentrant {
        Job storage job = jobs[_jobId];
        require(job.id == _jobId, "Job does not exist");
        require(msg.sender == job.client, "Only client");
        require(
            job.status == JobStatus.Completed,
            "Must be completed (no dispute)"
        );
        require(_score >= 1 && _score <= 5, "Score 1-5");
        require(
            job.freelancer != address(0) && job.bidAmount > 0,
            "No freelancer or bid"
        );

        payable(job.freelancer).transfer(job.bidAmount);
        job.reputationScore = _score;
        job.status = JobStatus.Resolved;
        emit PaymentReleased(_jobId, job.bidAmount);

        uint256 tokenId = reputationNFT.mintReputation(job.freelancer, _score);
        emit ReputationMinted(job.freelancer, tokenId, _score);
    }

    // Stake as Juror (can top-up)
    function stakeAsJuror() external payable nonReentrant {
        require(msg.value == STAKE_AMOUNT, "Must stake exactly 0.01 ETH");
        if (jurorStakes[msg.sender] == 0) {
            jurorPool.push(msg.sender);
        }
        jurorStakes[msg.sender] += msg.value;
        emit JurorStaked(msg.sender, msg.value);
    }

    // Withdraw Stake
    function withdrawStake() external nonReentrant {
        uint256 stake = jurorStakes[msg.sender];
        require(stake > 0, "No stake");
        jurorStakes[msg.sender] = 0;
        // Remove from pool
        for (uint i = 0; i < jurorPool.length; i++) {
            if (jurorPool[i] == msg.sender) {
                jurorPool[i] = jurorPool[jurorPool.length - 1];
                jurorPool.pop();
                break;
            }
        }
        payable(msg.sender).transfer(stake);
        emit StakeWithdrawn(msg.sender, stake);
    }

    // Raise Dispute
    function raiseDispute(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        require(job.id == _jobId, "Job does not exist");
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.Completed, "Must be completed");

        job.status = JobStatus.Disputed;
        disputeCounter++;
        disputes[disputeCounter] = Dispute({
            jobId: _jobId,
            client: msg.sender,
            freelancer: job.freelancer,
            totalStake: 0,
            votesFor: 0,
            votesAgainst: 0,
            jurorCount: 0,
            resolved: false,
            freelancerWon: false,
            raisedAt: block.timestamp
        });

        // Automatically select jurors
        _selectJurors(disputeCounter);

        emit DisputeRaised(disputeCounter, _jobId);
    }

    function _selectJurors(uint256 _disputeId) internal {
        require(
            jurorPool.length >= JURORS_PER_DISPUTE,
            "Not enough jurors in pool"
        );
        Dispute storage dispute = disputes[_disputeId];

        uint256 poolSize = jurorPool.length;
        for (uint i = 0; i < JURORS_PER_DISPUTE; i++) {
            uint256 rand = uint256(
                keccak256(
                    abi.encodePacked(
                        block.prevrandao,
                        block.timestamp,
                        _disputeId,
                        i
                    )
                )
            ) % poolSize;

            address selected = jurorPool[rand];

            // Swap to avoid duplicates in this selection
            jurorPool[rand] = jurorPool[poolSize - 1 - i];

            disputeJurors[_disputeId].push(
                Juror({
                    juror: selected,
                    stake: jurorStakes[selected],
                    hasVoted: false,
                    inFavor: false
                })
            );
            dispute.totalStake += jurorStakes[selected];
        }
        dispute.jurorCount = JURORS_PER_DISPUTE;
        emit JurorsSelected(_disputeId, JURORS_PER_DISPUTE);
    }

    // Vote on Dispute
    function voteOnDispute(uint256 _disputeId, bool _inFavor) external {
        Dispute storage dispute = disputes[_disputeId];
        require(!dispute.resolved, "Already resolved");
        require(
            dispute.jurorCount == JURORS_PER_DISPUTE,
            "Jurors not selected"
        );

        Juror[] storage jurors = disputeJurors[_disputeId];
        bool found = false;
        for (uint i = 0; i < jurors.length; i++) {
            if (jurors[i].juror == msg.sender && !jurors[i].hasVoted) {
                jurors[i].hasVoted = true;
                jurors[i].inFavor = _inFavor;
                if (_inFavor) dispute.votesFor += jurors[i].stake;
                else dispute.votesAgainst += jurors[i].stake;
                emit JurorVoted(_disputeId, msg.sender, _inFavor);
                found = true;
                break;
            }
        }
        require(found, "Not a juror or already voted");

        // Check if all voted
        uint256 totalVoted = 0;
        for (uint i = 0; i < jurors.length; i++) {
            if (jurors[i].hasVoted) totalVoted++;
        }

        if (totalVoted == JURORS_PER_DISPUTE) {
            bool freelancerWon = dispute.votesFor > dispute.votesAgainst;
            dispute.resolved = true;
            dispute.freelancerWon = freelancerWon;

            Job storage job = jobs[dispute.jobId];
            job.status = JobStatus.Resolved;

            if (freelancerWon) {
                payable(dispute.freelancer).transfer(job.bidAmount);
                emit PaymentReleased(dispute.jobId, job.bidAmount);
                uint256 tokenId = reputationNFT.mintReputation(
                    dispute.freelancer,
                    3
                ); // neutral score
                emit ReputationMinted(dispute.freelancer, tokenId, 3);
            } else {
                payable(dispute.client).transfer(job.bidAmount);
            }

            // Slash wrong voters
            for (uint i = 0; i < jurors.length; i++) {
                if (jurors[i].inFavor != freelancerWon) {
                    uint256 slash = jurors[i].stake / 2;
                    jurorStakes[jurors[i].juror] -= slash;
                    emit StakeSlashed(jurors[i].juror, slash);
                }
            }

            emit DisputeResolved(_disputeId, freelancerWon);
        }
    }

    // Cancel Job (only if no bids yet)
    function cancelJob(uint256 _jobId) external nonReentrant {
        Job storage job = jobs[_jobId];
        require(job.id == _jobId, "Job does not exist");
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.Open, "Not open");
        require(jobBids[_jobId].length == 0, "Cannot cancel after bids");
        payable(job.client).transfer(job.budget);
        delete jobs[_jobId];
    }

    // View Functions
    function getBidCount(uint256 _jobId) public view returns (uint256) {
        return jobBids[_jobId].length;
    }

    function getAllBids(uint256 _jobId) public view returns (Bid[] memory) {
        return jobBids[_jobId];
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getJurorPool() public view returns (address[] memory) {
        return jurorPool;
    }

    function getJob(uint256 _jobId) public view returns (Job memory) {
        return jobs[_jobId];
    }

    function getDispute(
        uint256 _disputeId
    ) public view returns (Dispute memory) {
        return disputes[_disputeId];
    }

    receive() external payable {}
}
