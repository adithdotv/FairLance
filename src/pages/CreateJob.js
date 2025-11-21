import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Box,
  Alert
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useNavigate } from 'react-router-dom';
import { inrToEth } from '../utils/currency';

const CreateJob = () => {
  const { contract, account } = useWeb3();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: '',
    budget: '',
    budgetInr: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!contract || !account) {
      setError('Please connect your wallet first');
      return;
    }

    if (!formData.description.trim() || !formData.budgetInr) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const budgetEth = inrToEth(formData.budgetInr);
      const budgetWei = ethers.parseEther(budgetEth);
      const tx = await contract.createJob(formData.description, { value: budgetWei });
      
      await tx.wait();
      
      // Reset form
      setFormData({ description: '', budget: '', budgetInr: '' });
      
      // Navigate to jobs page
      navigate('/jobs');
      
    } catch (error) {
      console.error('Error creating job:', error);
      setError('Error creating job: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to create a job.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32', mb: 4 }}>
        Post a New Job
      </Typography>
      
      <Card>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Box mb={3}>
              <TextField
                fullWidth
                label="Job Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Describe the work you need done, requirements, timeline, etc."
                variant="outlined"
              />
            </Box>
            
            <Box mb={3}>
              <TextField
                fullWidth
                label="Budget (INR)"
                name="budgetInr"
                type="number"
                value={formData.budgetInr}
                onChange={handleChange}
                placeholder="25000"
                variant="outlined"
                inputProps={{ step: "1000", min: "0" }}
                helperText={formData.budgetInr ? `≈ ${inrToEth(formData.budgetInr)} ETH - This amount will be held in escrow until the job is completed` : "Enter budget in Indian Rupees"}
              />
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box display="flex" gap={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ px: 4 }}
              >
                {loading ? 'Creating Job...' : 'Create Job'}
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/jobs')}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
      
      <Box mt={4}>
        <Alert severity="info">
          <Typography variant="subtitle2" gutterBottom>
            How it works:
          </Typography>
          <Typography variant="body2">
            • Your ETH budget will be held in the smart contract as escrow<br/>
            • Freelancers can submit bids for your job<br/>
            • You can accept a bid and the job will start<br/>
            • Once work is delivered, you can release payment and rate the freelancer<br/>
            • The freelancer will receive a reputation NFT based on your rating
          </Typography>
        </Alert>
      </Box>
    </Container>
  );
};

export default CreateJob;