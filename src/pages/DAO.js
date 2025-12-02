import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Divider,
  Link
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { ethToInr } from '../utils/currency';

const DAO = () => {
  const { contract, account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [jurorStake, setJurorStake] = useState('0');
  const [disputes, setDisputes] = useState([]);
  const [dialogs, setDialogs] = useState({
    stake: { open: false },
    withdraw: { open: false },
    vote: { open: false, disputeId: null, jobId: null }
  });

  const STAKE_AMOUNT = '0.01'; // 0.01 ETH

  const loadJurorStake = async () => {
    if (!contract || !account) return;
    
    try {
      const stake = await contract.jurorStakes(account);
      setJurorStake(ethers.formatEther(stake));
    } catch (error) {
      console.error('Error loading juror stake:', error);
    }
  };

  const loadDisputes = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const disputeCounter = await contract.disputeCounter();
      const disputesData = [];

      for (let i = 1; i <= disputeCounter; i++) {
        try {
          const dispute = await contract.disputes(i);
          const job = await contract.jobs(dispute[0]); // jobId is first element
          
          const disputeData = {
            id: i,
            jobId: dispute[0].toString(),
            client: dispute[1],
            freelancer: dispute[2],
            totalStake: ethers.formatEther(dispute[3]),
            votesFor: ethers.formatEther(dispute[4]),
            votesAgainst: ethers.formatEther(dispute[5]),
            jurorCount: dispute[6].toString(),
            resolved: dispute[7],
            freelancerWon: dispute[8],
            jobDescription: job[2], // description
            jobBudget: ethers.formatEther(job[3]),
            deliverableURI: job[7] // deliverable URI
          };

          disputesData.push(disputeData);
        } catch (error) {
          console.error(`Error loading dispute ${i}:`, error);
        }
      }

      setDisputes(disputesData);
    } catch (error) {
      console.error('Error loading disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStakeAsJuror = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.stakeAsJuror({ 
        value: ethers.parseEther(STAKE_AMOUNT) 
      });
      await tx.wait();
      
      setDialogs(prev => ({ ...prev, stake: { open: false } }));
      loadJurorStake();
      alert('Successfully staked as juror!');
    } catch (error) {
      console.error('Error staking as juror:', error);
      alert('Error staking as juror: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawStake = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.withdrawStake();
      await tx.wait();
      
      setDialogs(prev => ({ ...prev, withdraw: { open: false } }));
      loadJurorStake();
      alert('Successfully withdrew stake!');
    } catch (error) {
      console.error('Error withdrawing stake:', error);
      alert('Error withdrawing stake: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoteOnDispute = async (inFavor) => {
    const { disputeId } = dialogs.vote;
    if (!contract || !disputeId) return;

    try {
      setLoading(true);
      const tx = await contract.voteOnDispute(disputeId, inFavor);
      await tx.wait();
      
      setDialogs(prev => ({ ...prev, vote: { open: false, disputeId: null, jobId: null } }));
      loadDisputes();
      alert(`Vote submitted: ${inFavor ? 'In favor of freelancer' : 'In favor of client'}`);
    } catch (error) {
      console.error('Error voting on dispute:', error);
      alert('Error voting on dispute: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJurors = async (disputeId) => {
    if (!contract || !disputeId) return;

    try {
      setLoading(true);
      const tx = await contract.selectJurors(disputeId);
      await tx.wait();
      
      loadDisputes();
      alert(`Jurors selected for dispute #${disputeId}`);
    } catch (error) {
      console.error('Error selecting jurors:', error);
      alert('Error selecting jurors: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJurorStake();
    loadDisputes();
  }, [contract, account]);

  // Add event listeners for real-time updates
  useEffect(() => {
    if (!contract) return;

    const handleJurorStaked = () => {
      loadJurorStake();
    };

    const handleDisputeRaised = () => {
      loadDisputes();
    };

    const handleJurorVoted = () => {
      loadDisputes();
    };

    const handleDisputeResolved = () => {
      loadDisputes();
    };

    contract.on('JurorStaked', handleJurorStaked);
    contract.on('DisputeRaised', handleDisputeRaised);
    contract.on('JurorVoted', handleJurorVoted);
    contract.on('DisputeResolved', handleDisputeResolved);

    return () => {
      contract.off('JurorStaked', handleJurorStaked);
      contract.off('DisputeRaised', handleDisputeRaised);
      contract.off('JurorVoted', handleJurorVoted);
      contract.off('DisputeResolved', handleDisputeResolved);
    };
  }, [contract]);

  if (!account) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to access the DAO.
        </Alert>
      </Container>
    );
  }

  const activeDisputes = disputes.filter(d => !d.resolved);
  const resolvedDisputes = disputes.filter(d => d.resolved);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32', mb: 4 }}>
        🏛️ FairLance DAO
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Juror Dashboard" />
          <Tab label={`Active Disputes (${activeDisputes.length})`} />
          <Tab label={`Resolved Disputes (${resolvedDisputes.length})`} />
        </Tabs>
      </Box>

      {/* Juror Dashboard */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  👨‍⚖️ Your Juror Status
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Current Stake:
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {ethToInr(jurorStake)} ({jurorStake} ETH)
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Chip 
                    label={parseFloat(jurorStake) >= 0.01 ? "✅ Active Juror" : "❌ Not Staked"} 
                    color={parseFloat(jurorStake) >= 0.01 ? "success" : "default"}
                  />
                </Box>

                <Box display="flex" gap={1} flexWrap="wrap">
                  {parseFloat(jurorStake) < 0.01 ? (
                    <Button
                      variant="contained"
                      onClick={() => setDialogs(prev => ({ ...prev, stake: { open: true } }))}
                      disabled={loading}
                    >
                      💰 Stake as Juror
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setDialogs(prev => ({ ...prev, withdraw: { open: true } }))}
                      disabled={loading}
                    >
                      🏃 Withdraw Stake
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ℹ️ How DAO Works
                </Typography>
                
                <Typography variant="body2" paragraph>
                  • <strong>Stake 0.01 ETH</strong> to become a juror
                </Typography>
                <Typography variant="body2" paragraph>
                  • <strong>Vote on disputes</strong> between clients and freelancers
                </Typography>
                <Typography variant="body2" paragraph>
                  • <strong>Earn rewards</strong> for voting with the majority
                </Typography>
                <Typography variant="body2" paragraph>
                  • <strong>Lose 50% stake</strong> if you vote with the minority
                </Typography>
                <Typography variant="body2">
                  • <strong>3 jurors</strong> are selected for each dispute
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Active Disputes */}
      {tabValue === 1 && (
        <Box>
          {activeDisputes.length === 0 ? (
            <Alert severity="info">No active disputes at the moment.</Alert>
          ) : (
            <Grid container spacing={3}>
              {activeDisputes.map((dispute) => (
                <Grid item xs={12} key={dispute.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                          ⚖️ Dispute #{dispute.id} (Job #{dispute.jobId})
                        </Typography>
                        <Chip label="Active" color="warning" />
                      </Box>

                      <Typography variant="body2" paragraph>
                        <strong>Job:</strong> {dispute.jobDescription}
                      </Typography>
                      
                      <Typography variant="body2" paragraph>
                        <strong>Budget:</strong> {ethToInr(dispute.jobBudget)} ({dispute.jobBudget} ETH)
                      </Typography>

                      <Box mb={2}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Parties:</strong>
                        </Typography>
                        <Typography variant="caption" display="block">
                          Client: {dispute.client.slice(0, 6)}...{dispute.client.slice(-4)}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Freelancer: {dispute.freelancer.slice(0, 6)}...{dispute.freelancer.slice(-4)}
                        </Typography>
                      </Box>

                      {dispute.deliverableURI && (
                        <Box mb={2} p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="body2" gutterBottom>
                            <strong>📤 Submitted Deliverable:</strong>
                          </Typography>
                          <Link 
                            href={dispute.deliverableURI} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ 
                              wordBreak: 'break-all', 
                              fontSize: '0.875rem',
                              color: 'primary.main',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            {dispute.deliverableURI}
                          </Link>
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                            Click to review the freelancer's work before voting
                          </Typography>
                        </Box>
                      )}

                      <Box mb={2}>
                        <Typography variant="body2" gutterBottom>
                          Voting Progress ({dispute.jurorCount}/3 jurors):
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Box flex={1}>
                            <Typography variant="caption">For Freelancer: {dispute.votesFor} ETH</Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={parseFloat(dispute.totalStake) > 0 ? (parseFloat(dispute.votesFor) / parseFloat(dispute.totalStake)) * 100 : 0}
                              color="success"
                            />
                          </Box>
                          <Box flex={1}>
                            <Typography variant="caption">For Client: {dispute.votesAgainst} ETH</Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={parseFloat(dispute.totalStake) > 0 ? (parseFloat(dispute.votesAgainst) / parseFloat(dispute.totalStake)) * 100 : 0}
                              color="error"
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Box display="flex" gap={1} flexWrap="wrap">
                        {dispute.jurorCount === '0' && (
                          <Button
                            variant="outlined"
                            color="warning"
                            onClick={() => handleSelectJurors(dispute.id)}
                            disabled={loading}
                          >
                            👥 Select Jurors
                          </Button>
                        )}
                        
                        {parseFloat(jurorStake) >= 0.01 && dispute.jurorCount > '0' && (
                          <Button
                            variant="contained"
                            onClick={() => setDialogs(prev => ({ 
                              ...prev, 
                              vote: { open: true, disputeId: dispute.id, jobId: dispute.jobId } 
                            }))}
                            disabled={loading}
                          >
                            🗳️ Vote on Dispute
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Resolved Disputes */}
      {tabValue === 2 && (
        <Box>
          {resolvedDisputes.length === 0 ? (
            <Alert severity="info">No resolved disputes yet.</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Dispute ID</TableCell>
                    <TableCell>Job ID</TableCell>
                    <TableCell>Winner</TableCell>
                    <TableCell>Final Vote</TableCell>
                    <TableCell>Total Stake</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resolvedDisputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell>#{dispute.id}</TableCell>
                      <TableCell>#{dispute.jobId}</TableCell>
                      <TableCell>
                        <Chip 
                          label={dispute.freelancerWon ? "Freelancer" : "Client"} 
                          color={dispute.freelancerWon ? "success" : "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {dispute.votesFor} ETH vs {dispute.votesAgainst} ETH
                      </TableCell>
                      <TableCell>{dispute.totalStake} ETH</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Dialogs */}
      <Dialog open={dialogs.stake.open} onClose={() => setDialogs(prev => ({ ...prev, stake: { open: false } }))}>
        <DialogTitle>💰 Stake as Juror</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Stake 0.01 ETH to become a juror and participate in dispute resolution.
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Amount: {ethToInr(STAKE_AMOUNT)} ({STAKE_AMOUNT} ETH)
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Warning: You may lose 50% of your stake if you vote with the minority!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, stake: { open: false } }))}>
            Cancel
          </Button>
          <Button onClick={handleStakeAsJuror} disabled={loading} variant="contained">
            Stake 0.01 ETH
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogs.withdraw.open} onClose={() => setDialogs(prev => ({ ...prev, withdraw: { open: false } }))}>
        <DialogTitle>🏃 Withdraw Stake</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Withdraw your juror stake. You will no longer be able to vote on disputes.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current stake: {ethToInr(jurorStake)} ({jurorStake} ETH)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, withdraw: { open: false } }))}>
            Cancel
          </Button>
          <Button onClick={handleWithdrawStake} disabled={loading} variant="contained" color="error">
            Withdraw Stake
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogs.vote.open} onClose={() => setDialogs(prev => ({ ...prev, vote: { open: false, disputeId: null, jobId: null } }))}>
        <DialogTitle>🗳️ Vote on Dispute</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Cast your vote on this dispute. Choose carefully - minority voters lose 50% of their stake!
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Dispute #{dialogs.vote.disputeId} (Job #{dialogs.vote.jobId})
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Your vote is weighted by your stake amount ({jurorStake} ETH)
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, vote: { open: false, disputeId: null, jobId: null } }))}>
            Cancel
          </Button>
          <Button onClick={() => handleVoteOnDispute(false)} disabled={loading} variant="outlined" color="error">
            Vote for Client
          </Button>
          <Button onClick={() => handleVoteOnDispute(true)} disabled={loading} variant="contained" color="success">
            Vote for Freelancer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DAO;