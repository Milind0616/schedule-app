const express = require('express');
const Service = require('../models/Service');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Get all services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().populate('provider', 'name email');
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get services by provider
router.get('/provider/:providerId', async (req, res) => {
  try {
    const services = await Service.find({ provider: req.params.providerId }).populate('provider', 'name email');
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new service (only for authenticated providers)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, category, duration } = req.body;
    const service = new Service({
      name,
      description,
      price,
      category,
      duration,
      provider: req.user.id
    });
    const savedService = await service.save();
    res.status(201).json(savedService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a service (only by the provider who created it)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, description, price, category, duration } = req.body;
    service.name = name || service.name;
    service.description = description || service.description;
    service.price = price || service.price;
    service.category = category || service.category;
    service.duration = duration || service.duration;

    const updatedService = await service.save();
    res.json(updatedService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a service (only by the provider who created it)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });

    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await service.remove();
    res.json({ message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;