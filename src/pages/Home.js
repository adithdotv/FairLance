import React from 'react';
import { Container, Typography, Button, Box, Grid, Card, CardContent, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import SecurityIcon from '@mui/icons-material/Security';
import PaymentIcon from '@mui/icons-material/Payment';
import VerifiedIcon from '@mui/icons-material/Verified';
import GroupIcon from '@mui/icons-material/Group';

const Home = () => {
  const { account } = useWeb3();

  const features = [
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: '#2e7d32' }} />,
      title: 'Decentralized & Secure',
      description: 'Smart contracts ensure secure transactions without intermediaries'
    },
    {
      icon: <PaymentIcon sx={{ fontSize: 40, color: '#2e7d32' }} />,
      title: 'Escrow Payments',
      description: 'Funds are held in smart contracts until work is completed'
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 40, color: '#2e7d32' }} />,
      title: 'Reputation NFTs',
      description: 'Build your reputation with blockchain-verified NFT credentials'
    },
    {
      icon: <GroupIcon sx={{ fontSize: 40, color: '#2e7d32' }} />,
      title: 'DAO Governance',
      description: 'Community-driven dispute resolution through decentralized voting'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
          Welcome to FAIRLANCE
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#388e3c', mb: 4 }}>
          The Future of Decentralized Freelancing
        </Typography>
        <Typography variant="body1" sx={{ color: '#1b5e20', mb: 4, maxWidth: 600, mx: 'auto' }}>
          Connect with clients and freelancers on a trustless, blockchain-powered platform. 
          No middlemen, no excessive fees, just pure peer-to-peer collaboration.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {account ? (
            <>
              <Button 
                variant="contained" 
                size="large" 
                component={Link} 
                to="/jobs"
                sx={{ px: 4, py: 1.5 }}
              >
                Browse Jobs
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                component={Link} 
                to="/create-job"
                sx={{ px: 4, py: 1.5, color: '#2e7d32', borderColor: '#2e7d32' }}
              >
                Post a Job
              </Button>
            </>
          ) : (
            <Typography variant="h6" sx={{ color: '#2e7d32' }}>
              Connect your wallet to get started
            </Typography>
          )}
        </Box>
      </Box>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Box mb={2}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ mt: 6, p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          How It Works
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="primary">
              1. Post or Find Jobs
            </Typography>
            <Typography variant="body2">
              Clients post jobs with ETH escrow, freelancers browse and submit bids
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="primary">
              2. Work & Deliver
            </Typography>
            <Typography variant="body2">
              Accepted freelancers complete work and submit deliverables on-chain
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="primary">
              3. Get Paid & Rated
            </Typography>
            <Typography variant="body2">
              Clients release payment and mint reputation NFTs for completed work
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Home;