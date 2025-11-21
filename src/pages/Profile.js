import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Grid,
  Avatar,
  Paper,
  Divider
} from '@mui/material';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WorkIcon from '@mui/icons-material/Work';
import StarIcon from '@mui/icons-material/Star';
import { ethToInr } from '../utils/currency';

const Profile = () => {
  const { contract, account, provider } = useWeb3();
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    totalEarned: '0',
    totalSpent: '0',
    averageRating: 0,
    balance: '0'
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const jobStatusMap = {
    0: 'Open',
    1: 'In Progress',
    2: 'Completed',
    3: 'Disputed',
    4: 'Resolved'
  };

  const loadProfile = async () => {
    if (!contract || !account || !provider) return;

    try {
      setLoading(true);

      // Get wallet balance
      const balance = await provider.getBalance(account);

      // Load all jobs related to this user
      const jobCounter = await contract.jobCounter();
      const userJobs = [];
      let totalEarned = ethers.parseEther('0');
      let totalSpent = ethers.parseEther('0');
      let completedCount = 0;
      let totalRating = 0;
      let ratedJobs = 0;

      for (let i = 1; i <= jobCounter; i++) {
        try {
          const job = await contract.jobs(i);
          const jobData = {
            id: job[0].toString(),
            client: job[1],
            description: job[2],
            budget: job[3],
            status: parseInt(job[4]),
            freelancer: job[5],
            bidAmount: job[6],
            deliverableURI: job[7],
            reputationScore: parseInt(job[8])
          };

          const isClient = jobData.client.toLowerCase() === account.toLowerCase();
          const isFreelancer = jobData.freelancer.toLowerCase() === account.toLowerCase();

          if (isClient || isFreelancer) {
            userJobs.push({
              ...jobData,
              role: isClient ? 'Client' : 'Freelancer',
              budget: ethers.formatEther(jobData.budget),
              budgetInr: ethToInr(ethers.formatEther(jobData.budget)),
              bidAmount: jobData.bidAmount ? ethers.formatEther(jobData.bidAmount) : '0',
              bidAmountInr: jobData.bidAmount ? ethToInr(ethers.formatEther(jobData.bidAmount)) : '₹0'
            });

            if (jobData.status >= 2) { // Completed or higher
              completedCount++;

              if (isFreelancer && jobData.bidAmount > 0) {
                totalEarned = totalEarned + jobData.bidAmount;
              }

              if (isClient && jobData.bidAmount > 0) {
                totalSpent = totalSpent + jobData.bidAmount;
              }

              if (jobData.reputationScore > 0) {
                totalRating += jobData.reputationScore;
                ratedJobs++;
              }
            }
          }
        } catch (error) {
          console.error(`Error loading job ${i}:`, error);
        }
      }

      setStats({
        totalJobs: userJobs.length,
        completedJobs: completedCount,
        totalEarned: ethers.formatEther(totalEarned),
        totalEarnedInr: ethToInr(ethers.formatEther(totalEarned)),
        totalSpent: ethers.formatEther(totalSpent),
        totalSpentInr: ethToInr(ethers.formatEther(totalSpent)),
        averageRating: ratedJobs > 0 ? (totalRating / ratedJobs).toFixed(1) : 0,
        balance: ethers.formatEther(balance),
        balanceInr: ethToInr(ethers.formatEther(balance))
      });

      setRecentJobs(userJobs.slice(-5).reverse()); // Last 5 jobs

    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [contract, account, provider]);

  if (!account) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography sx={{ color: '#2e7d32' }}>
          Please connect your wallet to view your profile.
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <Avatar sx={{ width: 64, height: 64, mr: 3, bgcolor: 'primary.main' }}>
          <AccountBalanceWalletIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ color: '#2e7d32' }}>
            My Profile
          </Typography>
          <Typography variant="body1" sx={{ color: '#388e3c' }}>
            {account}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WorkIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary">
                {stats.totalJobs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <StarIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {stats.completedJobs}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                💰 Earned
              </Typography>
              <Typography variant="h5">
                {stats.totalEarnedInr}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({parseFloat(stats.totalEarned).toFixed(4)} ETH)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="secondary" gutterBottom>
                💸 Spent
              </Typography>
              <Typography variant="h5">
                {stats.totalSpentInr}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({parseFloat(stats.totalSpent).toFixed(4)} ETH)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Wallet Info
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Balance:</Typography>
                <Box textAlign="right">
                  <Typography variant="h6" color="primary">
                    {stats.balanceInr}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({parseFloat(stats.balance).toFixed(4)} ETH)
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">Average Rating:</Typography>
                <Box display="flex" alignItems="center">
                  <StarIcon sx={{ color: 'gold', mr: 0.5 }} />
                  <Typography variant="h6">
                    {stats.averageRating}/5
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Jobs
              </Typography>
              {recentJobs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No jobs yet
                </Typography>
              ) : (
                recentJobs.map((job, index) => (
                  <Box key={job.id}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" py={1}>
                      <Box>
                        <Typography variant="body2">
                          Job #{job.id} - {job.role}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.description.slice(0, 50)}...
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Chip
                          label={jobStatusMap[job.status]}
                          size="small"
                          color={job.status === 2 ? 'success' : 'default'}
                        />
                        <Typography variant="caption" display="block">
                          {job.role === 'Client' ? job.budgetInr : job.bidAmountInr}
                        </Typography>
                      </Box>
                    </Box>
                    {index < recentJobs.length - 1 && <Divider />}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;