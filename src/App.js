import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Web3Provider } from './contexts/Web3Context';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import CreateJob from './pages/CreateJob';
import MyJobs from './pages/MyJobs';
import Profile from './pages/Profile';
import FreelancerProfile from './pages/FreelancerProfile';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2e7d32', // Green
      light: '#4caf50',
      dark: '#1b5e20',
    },
    secondary: {
      main: '#66bb6a', // Light green
      light: '#81c784',
      dark: '#388e3c',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px rgba(46, 125, 50, 0.1)',
          border: '1px solid rgba(46, 125, 50, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#2e7d32',
          boxShadow: '0 2px 4px rgba(46, 125, 50, 0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Web3Provider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/create-job" element={<CreateJob />} />
              <Route path="/my-jobs" element={<MyJobs />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/freelancer/:address" element={<FreelancerProfile />} />
            </Routes>
          </div>
        </Router>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;