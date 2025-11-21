// Currency conversion utilities
export const ETH_TO_INR_RATE = 280000; // Approximate ETH to INR rate (update as needed)

export const ethToInr = (ethAmount) => {
  const eth = parseFloat(ethAmount);
  return (eth * ETH_TO_INR_RATE).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
};

export const inrToEth = (inrAmount) => {
  const inr = parseFloat(inrAmount);
  return (inr / ETH_TO_INR_RATE).toFixed(6);
};

export const formatInr = (amount) => {
  return parseFloat(amount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });
};

export const formatEthWithInr = (ethAmount) => {
  const eth = parseFloat(ethAmount);
  const inr = ethToInr(ethAmount);
  return `${inr} (${eth.toFixed(4)} ETH)`;
};