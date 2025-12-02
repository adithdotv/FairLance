import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Chip } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const Navbar = () => {
  const { account, connectWallet, disconnectWallet, loading } = useWeb3();
  const navigate = useNavigate();

  const handleWalletClick = () => {
    if (account) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  return (
    <AppBar position="static" sx={{ background: '#ffffff', color: '#2e7d32', boxShadow: '0 2px 4px rgba(46, 125, 50, 0.1)' }}>
      <Toolbar>
        <WorkIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          FAIRLANCE
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button color="inherit" component={Link} to="/">
            Home
          </Button>
          <Button color="inherit" component={Link} to="/jobs">
            Browse Jobs
          </Button>
          {account && (
            <>
              <Button color="inherit" component={Link} to="/create-job">
                Post Job
              </Button>
              <Button color="inherit" component={Link} to="/my-jobs">
                My Jobs
              </Button>
              <Button color="inherit" component={Link} to="/dao">
                🏛️ DAO
              </Button>
              <Button color="inherit" component={Link} to="/profile">
                Profile
              </Button>
            </>
          )}
          
          <Button
            variant="outlined"
            startIcon={<AccountBalanceWalletIcon />}
            onClick={handleWalletClick}
            disabled={loading}
            sx={{ ml: 2 }}
          >
            {loading ? 'Connecting...' : account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
          </Button>
          
          {account && (
            <Chip 
              label="Connected" 
              color="success" 
              size="small" 
            />
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;