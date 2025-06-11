module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'Hello from CommonJS!',
    method: req.method,
    timestamp: new Date().toISOString()
  });
};