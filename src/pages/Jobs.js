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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { ethToInr, inrToEth } from '../utils/currency';
import BidsList from '../components/BidsList';

const Jobs = () => {
  const { contract, account } = useWeb3();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bidDialog, setBidDialog] = useState({ open: false, jobId: null });
  const [bidAmountInr, setBidAmountInr] = useState('');
  const [acceptDialog, setAcceptDialog] = useState({ open: false, jobId: null, freelancer: '', bidAmount: '' });

  const jobStatusMap = {
    0: 'Open',
    1: 'In Progress', 
    2: 'Completed',
    3: 'Disputed',
    4: 'Resolved'
  };

  const loadJobs = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      const jobCounter = await contract.jobCounter();
      const jobsData = [];
      
      for (let i = 1; i <= jobCounter; i++) {
        try {
          const job = await contract.jobs(i);
          jobsData.push({
            id: job[0].toString(),
            client: job[1],
            description: job[2],
            budget: ethers.formatEther(job[3]),
            status: parseInt(job[4]),
            freelancer: job[5],
            bidAmount: job[6] ? ethers.formatEther(job[6]) : '0',
            deliverableURI: job[7],
            reputationScore: job[8].toString()
          });
        } catch (error) {
          console.error(`Error loading job ${i}:`, error);
        }
      }
      
      setJobs(jobsData.filter(job => job.status === 0)); // Only show open jobs
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async () => {
    if (!contract || !bidAmountInr || !bidDialog.jobId) return;
    
    try {
      setLoading(true);
      const bidAmountEth = inrToEth(bidAmountInr);
      const bidAmountWei = ethers.parseEther(bidAmountEth);
      const tx = await contract.submitBid(bidDialog.jobId, bidAmountWei);
      await tx.wait();
      
      setBidDialog({ open: false, jobId: null });
      setBidAmountInr('');
      loadJobs();
    } catch (error) {
      console.error('Error submitting bid:', error);
      alert('Error submitting bid: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async () => {
    if (!contract || !acceptDialog.jobId || !acceptDialog.freelancer || !acceptDialog.bidAmount) return;
    
    try {
      setLoading(true);
      const bidAmountWei = ethers.parseEther(acceptDialog.bidAmount);
      const tx = await contract.acceptBid(acceptDialog.jobId, acceptDialog.freelancer, bidAmountWei);
      await tx.wait();
      
      setAcceptDialog({ open: false, jobId: null, freelancer: '', bidAmount: '' });
      loadJobs();
    } catch (error) {
      console.error('Error accepting bid:', error);
      alert('Error accepting bid: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onAcceptBidFromList = (jobId, freelancer, bidAmount) => {
    setAcceptDialog({
      open: true,
      jobId: jobId,
      freelancer,
      bidAmount
    });
  };

  useEffect(() => {
    loadJobs();
  }, [contract]);

  if (!account) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to browse jobs.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32', mb: 4 }}>
        Available Jobs
      </Typography>
      
      {loading && jobs.length === 0 ? (
        <Typography sx={{ color: '#2e7d32' }}>Loading jobs...</Typography>
      ) : jobs.length === 0 ? (
        <Typography sx={{ color: '#2e7d32' }}>No open jobs available.</Typography>
      ) : (
        <Grid container spacing={3}>
          {jobs.map((job) => (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="h3">
                      Job {job.id}
                    </Typography>
                    <Chip 
                      label={jobStatusMap[job.status]} 
                      color="success" 
                      size="small" 
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {job.description}
                  </Typography>
                  
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="primary">
                      Budget: {ethToInr(job.budget)}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      ({job.budget} ETH)
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Client: {job.client.slice(0, 6)}...{job.client.slice(-4)}
                    </Typography>
                  </Box>
                  
                  {job.client.toLowerCase() !== account.toLowerCase() && (
                    <Button 
                      variant="contained" 
                      fullWidth
                      onClick={() => setBidDialog({ open: true, jobId: job.id })}
                      disabled={loading}
                    >
                      Submit Bid
                    </Button>
                  )}
                  
                  {job.client.toLowerCase() === account.toLowerCase() && (
                    <Chip label="Your Job" color="info" />
                  )}
                </CardContent>
                
                {/* Bids Section - Only visible to job owner */}
                {job.client.toLowerCase() === account.toLowerCase() && (
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
                        onAcceptBid={(freelancer, bidAmount) => onAcceptBidFromList(job.id, freelancer, bidAmount)}
                      />
                    </AccordionDetails>
                  </Accordion>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={bidDialog.open} onClose={() => setBidDialog({ open: false, jobId: null })}>
        <DialogTitle>Submit Bid</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Bid Amount (INR)"
            type="number"
            fullWidth
            variant="outlined"
            value={bidAmountInr}
            onChange={(e) => setBidAmountInr(e.target.value)}
            inputProps={{ step: "1000", min: "0" }}
            helperText={bidAmountInr ? `≈ ${inrToEth(bidAmountInr)} ETH` : 'Enter amount in Indian Rupees'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBidDialog({ open: false, jobId: null })}>
            Cancel
          </Button>
          <Button onClick={handleBid} disabled={loading || !bidAmountInr}>
            Submit Bid
          </Button>
        </DialogActions>
      </Dialog>

      {/* Accept Bid Dialog */}
      <Dialog open={acceptDialog.open} onClose={() => setAcceptDialog({ open: false, jobId: null, freelancer: '', bidAmount: '' })}>
        <DialogTitle>Accept Bid</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Are you sure you want to accept this bid?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Freelancer: {acceptDialog.freelancer}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Amount: {ethToInr(acceptDialog.bidAmount)} ({acceptDialog.bidAmount} ETH)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptDialog({ open: false, jobId: null, freelancer: '', bidAmount: '' })}>
            Cancel
          </Button>
          <Button onClick={handleAcceptBid} disabled={loading} variant="contained">
            Accept Bid
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Jobs;