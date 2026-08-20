const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./server/db');
const auth = require('./server/auth');
const ai = require('./server/ai');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Lead scoring algorithm (helper)
const calculateLeadScore = (lead) => {
  let score = 0;
  // Completed assessment
  if (lead.assessmentResult) score += 3;
  // Requested consultation
  if (lead.consultationStatus === 'requested' || lead.consultationStatus === 'booked') score += 5;
  // Source is Chat (highly interactive)
  if (lead.leadSource === 'chat') score += 2;
  // Provided specific business needs
  if (lead.need && lead.need.length > 10) score += 2;
  
  if (score >= 7) return 'High';
  if (score >= 4) return 'Medium';
  return 'Low';
};

// ==========================================
// PUBLIC API ENDPOINTS
// ==========================================

// Get public website settings (filters sensitive info)
app.get('/api/settings', (req, res) => {
  const settings = db.getSettings();
  const publicSettings = {
    businessName: settings.businessName,
    ownerName: settings.ownerName,
    email: settings.email,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    socialLinks: settings.socialLinks,
    siteTagline: settings.siteTagline,
    siteDescription: settings.siteDescription
  };
  res.json(publicSettings);
});

// Fetch active services list
app.get('/api/services', (req, res) => {
  const services = db.getCollection('services');
  res.json(services);
});

// Fetch individual service details
app.get('/api/services/:id', (req, res) => {
  const service = db.getById('services', req.params.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(service);
});

// Fetch resources/articles
app.get('/api/resources', (req, res) => {
  const resources = db.getCollection('resources');
  res.json(resources);
});

// Fetch specific resource article
app.get('/api/resources/:id', (req, res) => {
  const article = db.getById('resources', req.params.id);
  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json(article);
});

// Fetch public FAQs
app.get('/api/faqs', (req, res) => {
  const faqs = db.getCollection('faqs');
  res.json(faqs);
});

// Fetch public Testimonials
app.get('/api/testimonials', (req, res) => {
  const list = db.getCollection('testimonials');
  res.json(list);
});

// Fetch public Portfolio projects
app.get('/api/portfolio', (req, res) => {
  const list = db.getCollection('portfolio');
  res.json(list);
});

// AI Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history, leadId } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  // Record visitor question for analytics
  db.insert('analyticsEvents', {
    type: 'chat_question',
    question: message.substring(0, 200),
    timestamp: new Date().toISOString()
  });

  const chatResult = await ai.chat(message, history);

  let updatedLeadId = leadId;

  // If AI captured a lead, create/update lead in database
  if (chatResult.leadCaptured && chatResult.leadData) {
    const data = chatResult.leadData;
    
    // Check if lead already exists by email
    const leads = db.getCollection('leads');
    const existing = leads.find(l => l.email.toLowerCase() === data.email.toLowerCase());

    if (existing) {
      const updates = {
        name: data.name !== "Captured via Chat" ? data.name : existing.name,
        phone: data.phone || existing.phone,
        businessName: data.business !== "Chat Inquiry" ? data.business : existing.businessName,
        need: data.need || existing.need,
        chatSummary: chatResult.reply,
        lastInteraction: new Date().toISOString()
      };
      updates.intentScore = calculateLeadScore({ ...existing, ...updates });
      db.update('leads', existing.id, updates);
      updatedLeadId = existing.id;
    } else {
      const newLead = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        businessName: data.business,
        businessStage: data.stage || 'Idea Stage',
        need: data.need,
        leadSource: 'chat',
        chatSummary: chatResult.reply,
        status: 'new',
        intentScore: 'High', // AI identified intent
        notes: []
      };
      const created = db.insert('leads', newLead);
      updatedLeadId = created.id;
    }
  }

  res.json({
    reply: chatResult.reply,
    leadCaptured: chatResult.leadCaptured,
    leadId: updatedLeadId
  });
});

// Business Assessment submission
app.post('/api/assessment/submit', (req, res) => {
  const { 
    name, email, phone, businessName, industry, businessStage, 
    duration, revenue, employees, challenge, goal, supportRequired 
  } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Name and Email are required' });
  }

  // Calculate assessment scores & profile
  const strengths = [];
  const improvements = [];
  const recommendedServices = [];

  // Determine stage
  let stageTitle = "Startup Foundation";
  if (revenue === "yes") {
    stageTitle = "Operational Growth";
  }

  // Evaluate strengths and improvements
  if (revenue === "yes") {
    strengths.push("Revenue generating: Demonstrates market validation.");
  } else {
    improvements.push("Validation: Focus on verifying customer demand before building final products.");
  }

  if (employees === "1" || employees === "2-5") {
    strengths.push("Lean operations: Lower initial overhead costs.");
  }

  if (challenge.includes("branding") || challenge.includes("visibility") || challenge.includes("customers")) {
    recommendedServices.push("logo-design");
    recommendedServices.push("website-building");
    recommendedServices.push("digital-advertising");
    improvements.push("Digital footprint: Establishing dynamic marketing channels.");
  } else {
    recommendedServices.push("consultation");
    recommendedServices.push("business-readiness-support");
  }

  const assessmentResult = {
    stage: stageTitle,
    strengths,
    improvements,
    recommendedServices,
    answers: { industry, businessStage, duration, revenue, employees, challenge, goal, supportRequired }
  };

  // Save/Update lead
  const leads = db.getCollection('leads');
  const existing = leads.find(l => l.email.toLowerCase() === email.toLowerCase());
  
  let leadId;
  if (existing) {
    const updates = {
      name,
      phone: phone || existing.phone,
      businessName: businessName || existing.businessName,
      businessStage: businessStage || existing.businessStage,
      need: challenge,
      assessmentResult,
      lastInteraction: new Date().toISOString()
    };
    updates.intentScore = calculateLeadScore({ ...existing, ...updates });
    db.update('leads', existing.id, updates);
    leadId = existing.id;
  } else {
    const newLead = {
      name,
      email,
      phone,
      businessName,
      businessStage,
      need: challenge,
      leadSource: 'assessment',
      assessmentResult,
      status: 'new',
      notes: []
    };
    newLead.intentScore = calculateLeadScore(newLead);
    const created = db.insert('leads', newLead);
    leadId = created.id;
  }

  // Log analytics event
  db.insert('analyticsEvents', {
    type: 'assessment_complete',
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, leadId, result: assessmentResult });
});

// Book a consultation
app.post('/api/consultations/book', (req, res) => {
  const { 
    name, email, phone, businessName, industry, businessStage, 
    challenge, goal, serviceOfInterest, preferredDate, preferredTime 
  } = req.body;

  if (!email || !name || !preferredDate || !preferredTime) {
    return res.status(400).json({ error: 'Name, Email, Date, and Time are required' });
  }

  // Create/Update lead
  const leads = db.getCollection('leads');
  const existing = leads.find(l => l.email.toLowerCase() === email.toLowerCase());

  let leadId;
  const leadUpdates = {
    name,
    phone: phone || (existing ? existing.phone : ''),
    businessName: businessName || (existing ? existing.businessName : ''),
    businessStage: businessStage || (existing ? existing.businessStage : ''),
    need: challenge || (existing ? existing.need : ''),
    interestedService: serviceOfInterest,
    consultationStatus: 'requested',
    lastInteraction: new Date().toISOString()
  };

  if (existing) {
    leadUpdates.intentScore = calculateLeadScore({ ...existing, ...leadUpdates });
    db.update('leads', existing.id, leadUpdates);
    leadId = existing.id;
  } else {
    const newLead = {
      ...leadUpdates,
      email,
      leadSource: 'booking',
      status: 'new',
      notes: []
    };
    newLead.intentScore = calculateLeadScore(newLead);
    const created = db.insert('leads', newLead);
    leadId = created.id;
  }

  // Create Consultation booking record
  const consultation = db.insert('consultations', {
    leadId,
    preferredDate,
    preferredTime,
    status: 'requested',
    notes: `Goal: ${goal || 'General strategy session'}`
  });

  // Track analytics event
  db.insert('analyticsEvents', {
    type: 'booking_complete',
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, consultationId: consultation.id });
});

// Event tracking API
app.post('/api/analytics/track', (req, res) => {
  const { type, page } = req.body;
  if (!type) return res.status(400).json({ error: 'Event type is required' });

  db.insert('analyticsEvents', {
    type,
    page: page || 'unknown',
    timestamp: new Date().toISOString()
  });

  res.json({ success: true });
});


// ==========================================
// ADMIN AUTHENTICATION API
// ==========================================

// Login route
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });

  const result = auth.login(password);
  if (result.success) {
    res.json({ token: result.token });
  } else {
    res.status(401).json({ error: result.error });
  }
});


// ==========================================
// PROTECTED ADMIN API ENDPOINTS (Token Required)
// ==========================================

// Middleware for token validation on all subsequent admin paths
app.use('/api/admin', auth.requireAuth);

// Get full website settings including secret keys
app.get('/api/admin/settings', (req, res) => {
  const settings = db.getSettings();
  res.json(settings);
});

// Update website settings
app.put('/api/admin/settings', (req, res) => {
  const updates = req.body;
  
  // Protect adminPasswordHash from direct edit unless explicitly updating via auth.updatePassword
  delete updates.adminPasswordHash;
  
  const settings = db.updateSettings(updates);
  res.json({ success: true, settings });
});

// Change Admin Password
app.put('/api/admin/change-password', (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const result = auth.updatePassword(oldPassword, newPassword);
  
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: result.error });
  }
});

// --- CRM Leads Management ---
app.get('/api/admin/leads', (req, res) => {
  const leads = db.getCollection('leads');
  // Sort leads by date descending
  leads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(leads);
});

app.put('/api/admin/leads/:id', (req, res) => {
  const lead = db.update('leads', req.params.id, req.body);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  
  // Re-calculate intent score
  const updatedScore = calculateLeadScore(lead);
  if (lead.intentScore !== updatedScore) {
    db.update('leads', req.params.id, { intentScore: updatedScore });
  }

  res.json({ success: true, lead });
});

app.delete('/api/admin/leads/:id', (req, res) => {
  const lead = db.delete('leads', req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json({ success: true });
});

app.post('/api/admin/leads/:id/notes', (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ error: 'Note content is required' });

  const lead = db.getById('leads', req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const notes = lead.notes || [];
  notes.push({
    id: uuidv4(),
    text: note,
    createdAt: new Date().toISOString()
  });

  db.update('leads', req.params.id, { notes });
  res.json({ success: true, notes });
});

// --- CRM Consultations Management ---
app.get('/api/admin/consultations', (req, res) => {
  const consultations = db.getCollection('consultations');
  const leads = db.getCollection('leads');

  // Map lead name/business details onto consultation list for quick admin reading
  const enriched = consultations.map(c => {
    const lead = leads.find(l => l.id === c.leadId);
    return {
      ...c,
      leadName: lead ? lead.name : 'Unknown',
      leadEmail: lead ? lead.email : '',
      leadPhone: lead ? lead.phone : '',
      businessName: lead ? lead.businessName : ''
    };
  });

  enriched.sort((a, b) => new Date(a.preferredDate + 'T' + a.preferredTime) - new Date(b.preferredDate + 'T' + b.preferredTime));
  res.json(enriched);
});

app.put('/api/admin/consultations/:id', (req, res) => {
  const cons = db.update('consultations', req.params.id, req.body);
  if (!cons) return res.status(404).json({ error: 'Consultation not found' });
  
  // If consultation marked as completed, update corresponding lead's consultation status
  if (req.body.status) {
    db.update('leads', cons.leadId, { 
      consultationStatus: req.body.status,
      status: req.body.status === 'completed' ? 'consultation_completed' : 'consultation_booked' 
    });
  }

  res.json({ success: true, consultation: cons });
});

app.delete('/api/admin/consultations/:id', (req, res) => {
  const cons = db.delete('consultations', req.params.id);
  if (!cons) return res.status(404).json({ error: 'Consultation not found' });
  res.json({ success: true });
});

// --- CRUD Content Operations ---

// generic CRUD endpoints for services, resources, faqs, testimonials, portfolio, aiKnowledge
const setupCrudRoutes = (entityName) => {
  app.get(`/api/admin/${entityName}`, (req, res) => {
    res.json(db.getCollection(entityName));
  });

  app.post(`/api/admin/${entityName}`, (req, res) => {
    const item = db.insert(entityName, req.body);
    res.json({ success: true, item });
  });

  app.put(`/api/admin/${entityName}/:id`, (req, res) => {
    const item = db.update(entityName, req.params.id, req.body);
    if (!item) return res.status(404).json({ error: `${entityName} not found` });
    res.json({ success: true, item });
  });

  app.delete(`/api/admin/${entityName}/:id`, (req, res) => {
    const item = db.delete(entityName, req.params.id);
    if (!item) return res.status(404).json({ error: `${entityName} not found` });
    res.json({ success: true });
  });
};

setupCrudRoutes('services');
setupCrudRoutes('resources');
setupCrudRoutes('faqs');
setupCrudRoutes('testimonials');
setupCrudRoutes('portfolio');
setupCrudRoutes('aiKnowledge');

// --- Analytics & AI Dashboard Insights ---
app.get('/api/admin/analytics', (req, res) => {
  const events = db.getCollection('analyticsEvents');
  const leads = db.getCollection('leads');
  const consultations = db.getCollection('consultations');

  // Page views and conversions counting
  const pageViews = events.filter(e => e.type === 'page_view');
  const chatQuestions = events.filter(e => e.type === 'chat_question');

  // Services interest counting
  const serviceViews = {};
  events.filter(e => e.type === 'service_view').forEach(e => {
    const svc = e.page;
    serviceViews[svc] = (serviceViews[svc] || 0) + 1;
  });

  res.json({
    totalPageViews: pageViews.length,
    totalLeads: leads.length,
    totalConsultations: consultations.length,
    chatQuestionsCount: chatQuestions.length,
    serviceInterests: serviceViews,
    assessmentsCompleted: events.filter(e => e.type === 'assessment_complete').length,
    bookingsCompleted: events.filter(e => e.type === 'booking_complete').length
  });
});

app.get('/api/admin/insights', async (req, res) => {
  const leads = db.getCollection('leads');
  const events = db.getCollection('analyticsEvents');
  const chatQuestions = events.filter(e => e.type === 'chat_question').map(e => ({ question: e.question }));

  const insights = await ai.generateInsights(leads, chatQuestions);
  res.json(insights);
});


// Catch-all to serve homepage for clean routing fallbacks
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Creative Solutions Platform active at: http://localhost:${PORT}`);
});
