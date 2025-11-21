import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { ethToInr } from '../utils/currency';

const BidsList = ({ jobId, isClient, onAcceptBid }) => {
  const { contract } = useWeb3();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadBids = async () => {
    if (!contract || !jobId) return;
    
    try {
      setLoading(true);
      const allBids = await contract.getAllBids(jobId);
      
      const formattedBids = allBids.map((bid, index) => ({
        id: index,
        freelancer: bid.freelancer,
        amount: ethers.formatEther(bid.amount),
        amountInr: ethToInr(ethers.formatEther(bid.amount)),
        timestamp: new Date(Number(bid.timestamp) * 1000).toLocaleString()
      }));
      
      // Sort by amount (lowest first)
      formattedBids.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
      
      setBids(formattedBids);
    } catch (error) {
      console.error('Error loading bids:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBids();
  }, [contract, jobId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (bids.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
        No bids submitted yet
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Submitted Bids ({bids.length})
      </Typography>
      
      <List dense>
        {bids.map((bid, index) => (
          <React.Fragment key={bid.id}>
            <ListItem
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1
              }}
            >
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2" fontWeight="bold">
                      {bid.amountInr}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({bid.amount} ETH)
                    </Typography>
                    {index === 0 && (
                      <Chip label="Lowest" color="success" size="small" />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" display="block">
                      Freelancer: {' '}
                      <Link 
                        component={RouterLink} 
                        to={`/freelancer/${bid.freelancer}`}
                        sx={{ textDecoration: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {bid.freelancer.slice(0, 6)}...{bid.freelancer.slice(-4)}
                      </Link>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Submitted: {bid.timestamp}
                    </Typography>
                  </Box>
                }
              />
              
              {isClient && onAcceptBid && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onAcceptBid(bid.freelancer, bid.amount)}
                  sx={{ ml: 2 }}
                >
                  Accept
                </Button>
              )}
            </ListItem>
            
            {index < bids.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default BidsList;