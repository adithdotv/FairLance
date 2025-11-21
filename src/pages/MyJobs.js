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
  TextField,
  Rating,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { ethToInr, inrToEth } from '../utils/currency';
import BidsList from '../components/BidsList';

const MyJobs = () => {
  const { contract, account } = useWeb3();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [dialogs, setDialogs] = useState({
    acceptBid: { open: false, jobId: null, freelancer: '', bidAmount: '' },
    deliverable: { open: false, jobId: null },
    payment: { open: false, jobId: null },
    dispute: { open: false, jobId: null }
  });
  const [formData, setFormData] = useState({
    deliverableURI: '',
    rating: 5
  });

  const jobStatusMap = {
    0: 'Open',
    1: 'In Progress',
    2: 'Completed',
    3: 'Disputed',
    4: 'Resolved'
  };

  const loadJobs = async () => {
    if (!contract || !account) return;

    try {
      setLoading(true);
      const jobCounter = await contract.jobCounter();
      const jobsData = [];

      for (let i = 1; i <= jobCounter; i++) {
        try {
          const job = await contract.jobs(i);
          const jobData = {
            id: job[0].toString(),
            client: job[1],
            description: job[2],
            budget: ethers.formatEther(job[3]),
            status: parseInt(job[4]),
            freelancer: job[5],
            bidAmount: job[6] ? ethers.formatEther(job[6]) : '0',
            deliverableURI: job[7],
            reputationScore: job[8].toString()
          };

          // Include jobs where user is client or freelancer
          if (jobData.client.toLowerCase() === account.toLowerCase() ||
            jobData.freelancer.toLowerCase() === account.toLowerCase()) {
            jobsData.push(jobData);
          }
        } catch (error) {
          console.error(`Error loading job ${i}:`, error);
        }
      }

      setJobs(jobsData);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async () => {
    const { jobId, freelancer, bidAmount } = dialogs.acceptBid;
    if (!contract || !jobId || !freelancer || !bidAmount) return;

    try {
      setLoading(true);
      const bidAmountWei = ethers.parseEther(bidAmount);
      const tx = await contract.acceptBid(jobId, freelancer, bidAmountWei);
      await tx.wait();

      setDialogs(prev => ({ ...prev, acceptBid: { open: false, jobId: null, freelancer: '', bidAmount: '' } }));
      loadJobs();
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert('Error accepting bid: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onAcceptBidFromList = (freelancer, bidAmount) => {
    setDialogs(prev => ({
      ...prev,
      acceptBid: {
        open: true,
        jobId: prev.acceptBid.jobId,
        freelancer,
        bidAmount
      }
    }));
  };

  const handleSubmitDeliverable = async () => {
    const { jobId } = dialogs.deliverable;
    if (!contract || !jobId || !formData.deliverableURI) return;

    try {
      setLoading(true);
      const tx = await contract.submitDeliverable(jobId, formData.deliverableURI);
      await tx.wait();

      setDialogs(prev => ({ ...prev, deliverable: { open: false, jobId: null } }));
      setFormData(prev => ({ ...prev, deliverableURI: '' }));
      loadJobs();
    } catch (error) {
      console.error('Error submitting deliverable:', error);
      alert('Error submitting deliverable: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    const { jobId } = dialogs.payment;
    if (!contract || !jobId) return;

    try {
      setLoading(true);
      const tx = await contract.releasePayment(jobId, formData.rating);
      await tx.wait();

      setDialogs(prev => ({ ...prev, payment: { open: false, jobId: null } }));
      setFormData(prev => ({ ...prev, rating: 5 }));
      loadJobs();
    } catch (error) {
      console.error('Error releasing payment:', error);
      alert('Error releasing payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    const { jobId } = dialogs.dispute;
    if (!contract || !jobId) return;

    try {
      setLoading(true);
      const tx = await contract.raiseDispute(jobId);
      await tx.wait();

      setDialogs(prev => ({ ...prev, dispute: { open: false, jobId: null } }));
      loadJobs();
    } catch (error) {
      console.error('Error raising dispute:', error);
      alert('Error raising dispute: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [contract, account]);

  // Add event listeners for real-time updates
  useEffect(() => {
    if (!contract) return;

    const handleDeliverableSubmitted = () => {
      console.log('Deliverable submitted, refreshing jobs...');
      loadJobs();
    };

    const handleBidAccepted = () => {
      console.log('Bid accepted, refreshing jobs...');
      loadJobs();
    };

    const handlePaymentReleased = () => {
      console.log('Payment released, refreshing jobs...');
      loadJobs();
    };

    const handleDisputeRaised = () => {
      console.log('Dispute raised, refreshing jobs...');
      loadJobs();
    };

    // Listen to contract events
    contract.on('DeliverableSubmitted', handleDeliverableSubmitted);
    contract.on('BidAccepted', handleBidAccepted);
    contract.on('PaymentReleased', handlePaymentReleased);
    contract.on('DisputeRaised', handleDisputeRaised);

    // Cleanup event listeners
    return () => {
      contract.off('DeliverableSubmitted', handleDeliverableSubmitted);
      contract.off('BidAccepted', handleBidAccepted);
      contract.off('PaymentReleased', handlePaymentReleased);
      contract.off('DisputeRaised', handleDisputeRaised);
    };
  }, [contract]);

  if (!account) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to view your jobs.
        </Alert>
      </Container>
    );
  }

  const clientJobs = jobs.filter(job => job.client.toLowerCase() === account.toLowerCase());
  const freelancerJobs = jobs.filter(job => job.freelancer.toLowerCase() === account.toLowerCase());

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ color: '#2e7d32' }}>
          My Jobs
        </Typography>
        <Button
          variant="outlined"
          onClick={loadJobs}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Posted Jobs (${clientJobs.length})`} />
          <Tab label={`Working On (${freelancerJobs.length})`} />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Grid container spacing={3}>
          {clientJobs.length === 0 ? (
            <Grid item xs={12}>
              <Typography sx={{ color: '#2e7d32' }}>No jobs posted yet.</Typography>
            </Grid>
          ) : (
            clientJobs.map((job) => (
              <Grid item xs={12} md={6} key={job.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">Job #{job.id}</Typography>
                      <Chip
                        label={jobStatusMap[job.status]}
                        color={job.status === 2 ? "success" : job.status === 3 ? "error" : "primary"}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" paragraph>{job.description}</Typography>
                    <Typography variant="subtitle2" color="primary">Budget: {ethToInr(job.budget)}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary">({job.budget} ETH)</Typography>

                    {job.freelancer !== ethers.ZeroAddress && (
                      <Typography variant="caption" display="block">
                        Freelancer: {' '}
                        <Link
                          component={RouterLink}
                          to={`/freelancer/${job.freelancer}`}
                          sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {job.freelancer.slice(0, 6)}...{job.freelancer.slice(-4)}
                        </Link>
                      </Typography>
                    )}

                    {job.status === 2 && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          🎉 Work Completed! Review the deliverable and take action.
                        </Typography>
                      </Alert>
                    )}

                    {job.deliverableURI && job.status >= 2 && (
                      <Box mt={1} p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="subtitle2" color="success.main" gutterBottom>
                          📤 Deliverable Submitted:
                        </Typography>
                        <Link
                          href={job.deliverableURI}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ wordBreak: 'break-all', fontSize: '0.875rem' }}
                        >
                          {job.deliverableURI}
                        </Link>
                      </Box>
                    )}

                    <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                      {job.status === 2 && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => setDialogs(prev => ({
                              ...prev,
                              payment: { open: true, jobId: job.id }
                            }))}
                          >
                            ✅ Release Payment
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => setDialogs(prev => ({
                              ...prev,
                              dispute: { open: true, jobId: job.id }
                            }))}
                          >
                            ⚠️ Raise Dispute
                          </Button>
                        </>
                      )}
                    </Box>
                  </CardContent>

                  {/* Bids Section for Open Jobs */}
                  {job.status === 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                          Manage Bids
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <BidsList
                          jobId={job.id}
                          isClient={true}
                          onAcceptBid={(freelancer, bidAmount) => {
                            setDialogs(prev => ({
                              ...prev,
                              acceptBid: {
                                open: true,
                                jobId: job.id,
                                freelancer,
                                bidAmount
                              }
                            }));
                          }}
                        />
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )
      }

      {
        tabValue === 1 && (
          <Grid container spacing={3}>
            {freelancerJobs.length === 0 ? (
              <Grid item xs={12}>
                <Typography sx={{ color: '#2e7d32' }}>No active freelance jobs.</Typography>
              </Grid>
            ) : (
              freelancerJobs.map((job) => (
                <Grid item xs={12} md={6} key={job.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Job #{job.id}</Typography>
                        <Chip label={jobStatusMap[job.status]} color="secondary" size="small" />
                      </Box>

                      <Typography variant="body2" paragraph>{job.description}</Typography>
                      <Typography variant="subtitle2" color="primary">
                        Your Bid: {ethToInr(job.bidAmount)}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        ({job.bidAmount} ETH)
                      </Typography>

                      {job.status === 1 && (
                        <Box mt={2}>
                          <Button
                            variant="contained"
                            onClick={() => setDialogs(prev => ({
                              ...prev,
                              deliverable: { open: true, jobId: job.id }
                            }))}
                          >
                            Submit Deliverable
                          </Button>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )
      }

      {/* Dialogs */}
      <Dialog open={dialogs.acceptBid.open} onClose={() => setDialogs(prev => ({ ...prev, acceptBid: { open: false, jobId: null, freelancer: '', bidAmount: '' } }))}>
        <DialogTitle>Accept Bid</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Are you sure you want to accept this bid?
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Freelancer: {dialogs.acceptBid.freelancer}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Amount: {ethToInr(dialogs.acceptBid.bidAmount)} ({dialogs.acceptBid.bidAmount} ETH)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, acceptBid: { open: false, jobId: null, freelancer: '', bidAmount: '' } }))}>Cancel</Button>
          <Button onClick={handleAcceptBid} disabled={loading} variant="contained">Accept Bid</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogs.deliverable.open} onClose={() => setDialogs(prev => ({ ...prev, deliverable: { open: false, jobId: null } }))}>
        <DialogTitle>Submit Deliverable</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Deliverable URI/Link"
            fullWidth
            variant="outlined"
            value={formData.deliverableURI}
            onChange={(e) => setFormData(prev => ({ ...prev, deliverableURI: e.target.value }))}
            placeholder="https://... or IPFS hash"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, deliverable: { open: false, jobId: null } }))}>Cancel</Button>
          <Button onClick={handleSubmitDeliverable} disabled={loading}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogs.payment.open} onClose={() => setDialogs(prev => ({ ...prev, payment: { open: false, jobId: null } }))}>
        <DialogTitle>Release Payment & Rate</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography component="legend">Rate the freelancer's work:</Typography>
            <Rating
              value={formData.rating}
              onChange={(event, newValue) => setFormData(prev => ({ ...prev, rating: newValue }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, payment: { open: false, jobId: null } }))}>Cancel</Button>
          <Button onClick={handleReleasePayment} disabled={loading}>Release Payment</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogs.dispute.open} onClose={() => setDialogs(prev => ({ ...prev, dispute: { open: false, jobId: null } }))}>
        <DialogTitle>Raise Dispute</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to raise a dispute for this job? This will initiate a DAO voting process.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs(prev => ({ ...prev, dispute: { open: false, jobId: null } }))}>Cancel</Button>
          <Button onClick={handleRaiseDispute} disabled={loading} color="error">Raise Dispute</Button>
        </DialogActions>
      </Dialog>
    </Container >
  );
};

export default MyJobs;