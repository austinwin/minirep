const readFileSync = () => {
  throw new Error('fs is not available in this environment');
};

const fs = { readFileSync };

export { readFileSync };
export default fs;
