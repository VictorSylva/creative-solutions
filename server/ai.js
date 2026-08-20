const { GoogleGenAI } = require('@google/generative-ai');
const db = require('./db');

// Helper to normalize strings for matching
const containsAny = (str, keywords) => {
  const lower = str.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
};

// Local fallback engine when no Gemini key is provided
const handleLocalFallback = (message, history) => {
  const lowerMsg = message.toLowerCase();
  let reply = "";
  let leadData = null;
  let leadCaptured = false;

  // Simple regex to detect email and phone in message
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
  const phoneRegex = /(\+?[\d-\s]{8,15})/;
  
  const emailMatch = message.match(emailRegex);
  const phoneMatch = message.match(phoneRegex);

  // If user seems to be answering lead details prompt
  if ((emailMatch || phoneMatch) && containsAny(message, ['my name', 'call me', 'name is', '@', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])) {
    const email = emailMatch ? emailMatch[0] : "";
    const phone = phoneMatch ? phoneMatch[0] : "";
    
    reply = "Thank you for sharing your contact details! I have recorded your interest. Blessing Udechukwu will reach out to you shortly. You can also proceed to book a specific date on our Book Consultation page.";
    leadCaptured = true;
    leadData = {
      name: "Captured via Chat",
      email: email || "unknown@chat.com",
      phone: phone || "unknown",
      businessName: "Chat Inquiry",
      need: "Consultation / Service inquiry",
      businessStage: "Unspecified",
      intent: "high"
    };
  }
  // Funding questions
  else if (containsAny(message, ['fund', 'loan', 'grant', 'finance', 'invest', 'money', 'capital'])) {
    reply = "Creative Solutions does not provide direct funding, loans, or grants. Instead, we analyze your business ideas, readiness, and packaging, and provide the strategic roadmap, branding, and digital presence needed to make your business attractive to potential funders or partners. Would you like to check your readiness using our Business Assessment tool?";
  }
  // Website
  else if (containsAny(message, ['website', 'web', 'page', 'site', 'online presence'])) {
    reply = "We build custom, responsive websites designed to showcase your business, build trust, and capture customer leads. Our websites are mobile-friendly and optimized for SEO. Would you like to schedule a consultation to discuss a website project?";
  }
  // Logo / Branding
  else if (containsAny(message, ['logo', 'brand', 'identity', 'design logo'])) {
    reply = "Your logo is the face of your business. Creative Solutions designs professional, recognizable visual identities, complete with logo assets, typography, and color guides. Let us help you look established. Would you like to view our branding services?";
  }
  // Portfolio
  else if (containsAny(message, ['portfolio', 'cv', 'resume', 'case study', 'work showcase'])) {
    reply = "We help professionals and businesses compile their achievements, write clean project case studies, and format stunning digital portfolios that convince high-value clients. If you'd like to build your portfolio, let us know!";
  }
  // flyer
  else if (containsAny(message, ['flyer', 'poster', 'banner', 'design flyer'])) {
    reply = "We design professional promotional materials (digital and print flyers) to help you launch events, advertise offers, and drive customers to your business. Let's make your message stand out.";
  }
  // Consultation
  else if (containsAny(message, ['consult', 'meeting', 'book', 'call', 'talk', 'appointment', 'schedule'])) {
    reply = "I can definitely help you get started with a consultation! To help Blessing Udechukwu prepare, please share your: \n- Full Name\n- Email Address\n- Phone Number\n- Business Name or Idea\n\nAlternatively, you can book directly using the calendar link on our 'Book a Consultation' page.";
  }
  // Blessing / Owner
  else if (containsAny(message, ['who is', 'owner', 'blessing', 'udechukwu'])) {
    reply = "Creative Solutions was founded by Blessing Udechukwu, a strategic advisor and digital specialist. Blessing helps startup founders and established business owners develop growth strategies and premium digital branding. You can reach Blessing at blessingaduba1@gmail.com.";
  }
  // Pricing
  else if (containsAny(message, ['price', 'cost', 'how much', 'fee', 'charge'])) {
    reply = "Our pricing is customized to the scope of your project (e.g., website complexity, logo iterations, or depth of advisory support). We ensure high-value solutions at professional, practical rates. To get an exact quote, we recommend booking a free initial consultation!";
  }
  // Greetings
  else if (containsAny(message, ['hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon'])) {
    reply = "Hello! I am the Creative Solutions Business Assistant. I can explain our services (Branding, Websites, Portfolio Building, Strategy), answer business readiness questions, or help you book a consultation with Blessing. What are you looking to achieve today?";
  }
  // Default/general business response
  else {
    reply = "I understand you are asking about that. Creative Solutions helps individuals and businesses turn ideas into practical, growth-oriented solutions. Would you like to schedule a consultation with Blessing to discuss your specific business goals, or take our interactive Business Assessment?";
  }

  return { reply, leadCaptured, leadData };
};

const ai = {
  async chat(message, history = []) {
    const settings = db.getSettings();
    const apiKey = settings.geminiApiKey;

    // Use fallback if API key is not configured
    if (!apiKey) {
      return handleLocalFallback(message, history);
    }

    try {
      // Initialize Gemini SDK
      // The SDK uses system instruction and model calls.
      const aiClient = new GoogleGenAI({ apiKey: apiKey });
      
      // Load company details & context
      const services = db.getCollection('services');
      const faqs = db.getCollection('faqs');
      const testimonials = db.getCollection('testimonials');
      const knowledge = db.getCollection('aiKnowledge');

      const servicesContext = services.map(s => `- ${s.name}: ${s.description} (Category: ${s.category}). Problem solved: ${s.problemSolved}. Deliverables: ${s.whatWeProvide}. Process: ${s.expectedProcess}.`).join('\n');
      const faqsContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
      const knowledgeContext = knowledge.map(k => `[${k.title}]: ${k.content}`).join('\n\n');
      const testimonialsContext = testimonials.map(t => `"${t.text}" - ${t.clientName}, ${t.businessName}`).join('\n');

      const systemInstruction = `
You are the AI Business Assistant for "Creative Solutions", an advisory, business growth, and creative services platform owned by Blessing Udechukwu (Email: blessingaduba1@gmail.com).

YOUR PRINCIPLE: Give value first. Capture interest second. Convert when appropriate. Do not sound salesy or force meetings immediately. Answer questions intelligently, providing guidance on starting a business, branding, website needs, and growth strategy.

Approved Business Context:
- Owner/Founder: Blessing Udechukwu
- Services Offered:
${servicesContext}

- FAQ Guidelines:
${faqsContext}

- Additional Company Knowledge:
${knowledgeContext}

- Client Testimonials:
${testimonialsContext}

AI Constraints & Rules:
1. STRICT: Do NOT guarantee funding, grants, loans, or investor approvals. Do NOT state specific funding amounts or approval rates. If asked about money, explain that Creative Solutions helps businesses structure their business models, records, and branding so they are ready for investment or growth, but doesn't supply capital.
2. STRICT: Do NOT invent facts, achievements, or partnerships that are not in the approved context above. If you don't know something, say: "I don't have enough verified information to answer that accurately. You may want to speak directly with Creative Solutions."
3. Lead Capture: If the visitor expresses high intent to hire, buy, or get detailed help (e.g. "I want to build a site", "I need a consultation", "I want to work with Blessing"), gently prompt them to share their name, email, phone, business name (or idea), and specific needs.
4. Lead Data Extraction: If they provide their contact details (or if they are already in the conversation), output a structured JSON block at the very end of your response. This block MUST be formatted exactly as:
||LEAD_DATA||{"name": "...", "email": "...", "phone": "...", "business": "...", "need": "...", "stage": "...", "intent": "high"}||
Ensure the JSON block is on its own line and valid. Fill in what they've shared. Set intent to "high" or "medium" based on their inquiries.
5. Keep answers clear, professional, mature, and helpful. Do not mention "InteracAI", "Generative AI", or "Large Language Model". You are the Creative Solutions Assistant.
`;

      // Structure history for Gemini API
      // GoogleGenAI chat expects { role: 'user'|'model', parts: [{ text: '...' }] }
      const contents = [];
      
      // Add history (limit to last 10 messages for token control)
      const recentHistory = history.slice(-10);
      recentHistory.forEach(h => {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });

      // Add the new user message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3,
        }
      });

      const responseText = response.text || "";
      
      // Parse structured lead data block if present
      let reply = responseText;
      let leadCaptured = false;
      let leadData = null;

      const leadBlockRegex = /\|\|LEAD_DATA\|\|([\s\S]+?)\|\|/;
      const match = responseText.match(leadBlockRegex);
      
      if (match) {
        try {
          leadData = JSON.parse(match[1].trim());
          leadCaptured = true;
          // Strip the JSON block from the public reply
          reply = responseText.replace(leadBlockRegex, '').trim();
        } catch (e) {
          console.error("Failed to parse lead data block from Gemini response:", e);
        }
      }

      return { reply, leadCaptured, leadData };
    } catch (error) {
      console.error("Gemini API Error, falling back to local engine:", error);
      return handleLocalFallback(message, history);
    }
  },

  // Generates AI Business Insights from existing CRM leads and questions
  async generateInsights(leads, questions) {
    const settings = db.getSettings();
    const apiKey = settings.geminiApiKey;

    const defaultInsights = {
      summary: "This month, visitors are showing interest in setting up professional branding and seeking startup support. Ensure your portfolio features recent logo and website builds.",
      commonQuestions: "1. Preparing a business for startup funding. 2. Website building timelines and maintenance. 3. Preparation needed for consultations.",
      recommendedAction: "Write a new guide on 'How to register and structure a business in Nigeria' to capture early stage startup leads."
    };

    if (!apiKey) {
      return defaultInsights;
    }

    try {
      const aiClient = new GoogleGenAI({ apiKey: apiKey });

      const leadsSummary = leads.map(l => `- Need: ${l.interestedService || l.need || 'Unspecified'}, Stage: ${l.businessStage || 'Unspecified'}, Status: ${l.status}, Intent: ${l.intentScore}`).join('\n');
      const questionsSummary = questions.map(q => `- Q: ${q.question}`).join('\n');

      const systemInstruction = `
You are the business intelligence advisor for Blessing Udechukwu, owner of Creative Solutions.
You will analyze the current monthly lead logs and recent chatbot questions to provide key strategic insights.
Do not invent numbers. Summarize trends realistically.
Provide your response in JSON format matching exactly:
{
  "summary": "1-2 sentence overview of visitor needs.",
  "commonQuestions": "Numbered list of the top 3 questions people are asking.",
  "recommendedAction": "1 strategic action item for Blessing."
}
`;

      const prompt = `
Lead logs:
${leadsSummary || "No leads this period."}

Chat questions:
${questionsSummary || "No questions asked yet."}
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json'
        }
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini Insights generation failed:", error);
      return defaultInsights;
    }
  }
};

module.exports = ai;
