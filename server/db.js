const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../data/db.json');
const BACKUP_PATH = path.join(__dirname, '../data/db_backup.json');

// Default Database Schema & Seed Data
const DEFAULT_DB = {
  settings: {
    businessName: "Creative Solutions",
    ownerName: "Blessing Udechukwu",
    email: "blessingaduba1@gmail.com",
    phone: "+234 812 345 6789",
    whatsapp: "https://wa.me/2348123456789",
    socialLinks: {
      facebook: "https://facebook.com/creativesolutions",
      instagram: "https://instagram.com/creativesolutions",
      linkedin: "https://linkedin.com/company/creativesolutions",
      twitter: "https://twitter.com/creativesolutions"
    },
    geminiApiKey: "",
    adminPasswordHash: "", // Will be generated as 'admin1234' on boot if empty
    enableNotifications: true,
    siteTagline: "Turning Ideas Into Practical Solutions and Business Growth.",
    siteDescription: "Creative Solutions supports entrepreneurs and businesses with strategic guidance, creative services, digital solutions and business support designed to help them move from ideas to meaningful results."
  },
  services: [
    {
      id: "portfolio-building",
      name: "Portfolio Building",
      category: "creative",
      description: "Professional portfolios that communicate skills, work and value.",
      icon: "briefcase",
      problemSolved: "Talented individuals and professionals fail to land clients or jobs because they lack a structured, polished showcase of their capabilities.",
      whatWeProvide: "We design and curate professional digital portfolios, compile project sheets, write compelling case studies of your past work, and format your professional bio for maximum impact.",
      expectedProcess: "1. Intake session to gather work history and assets. 2. Selection and editing of key projects. 3. Portfolio design and content drafting. 4. Final delivery of digital asset/live link.",
      faqs: [
        { q: "What should I include in my portfolio if I have little experience?", a: "We help you highlight personal projects, volunteer work, and training assignments structured as professional case studies to demonstrate your potential." },
        { q: "Do you build the portfolio website too?", a: "Yes, we can design the layout. If you need a fully interactive live website, we recommend combining this with our Website Building service." }
      ]
    },
    {
      id: "website-building",
      name: "Website Building",
      category: "digital",
      description: "Modern websites that establish credibility and provide businesses with a strong digital presence.",
      icon: "globe",
      problemSolved: "Businesses lose credibility and potential leads because they don't have a professional online home or because their current website is hard to navigate.",
      whatWeProvide: "Custom responsive website design and development, optimized for desktop and mobile, with integrated contact forms, clear call-to-actions, basic SEO setup, and fast loading speeds.",
      expectedProcess: "1. Strategy call to define website goals. 2. Layout design approval. 3. Development and copywriting. 4. Testing and launch support.",
      faqs: [
        { q: "Will I be able to update my website content myself?", a: "Yes. All our websites are built with user-friendly content controls or custom dashboards so you can manage pages without coding." },
        { q: "How long does it take to build a business website?", a: "Typically between 2 to 4 weeks depending on the complexity and scope of the website." }
      ]
    },
    {
      id: "logo-design",
      name: "Logo Design",
      category: "creative",
      description: "Professional identity design that helps businesses become recognizable.",
      icon: "palette",
      problemSolved: "Businesses struggle to look trustworthy and memorable because they use generic logos or lack consistent branding.",
      whatWeProvide: "Custom logo concepts, color palette definition, typography selection, and a basic brand guide containing raw and print-ready files.",
      expectedProcess: "1. Brand questionnaire and reference moodboard. 2. Presentation of logo concepts. 3. Feedback and refinements. 4. Delivery of full brand asset package.",
      faqs: [
        { q: "What files do I receive?", a: "You will receive high-resolution PNG and JPEG files, vector source files (AI/EPS) for scaling, and transparent background versions." },
        { q: "How many revisions do I get?", a: "Our standard package includes 3 rounds of design refinements to make sure you are fully satisfied." }
      ]
    },
    {
      id: "consultation",
      name: "Strategic Consultation",
      category: "strategic",
      description: "One-on-one professional guidance based on the client's specific needs.",
      icon: "users",
      problemSolved: "Entrepreneurs and business owners make costly mistakes due to a lack of strategic direction, guidance, and clear planning.",
      whatWeProvide: "Focused strategy sessions to analyze your business ideas, assess market readiness, identify operational bottlenecks, and map out practical steps for execution and growth.",
      expectedProcess: "1. Pre-meeting questionnaire to analyze goals. 2. 60-minute intensive call or in-person session. 3. Written post-session summary report with action items.",
      faqs: [
        { q: "How should I prepare for a consultation?", a: "We recommend writing down your top three current business challenges and gathering any existing business materials or plans." },
        { q: "What happens after the consultation?", a: "You will receive a clear action sheet. You can then choose to execute the steps independently or leverage our support services for implementation." }
      ]
    },
    {
      id: "digital-advertising",
      name: "Digital Advertising & Promotions",
      category: "digital",
      description: "Digital promotional solutions designed to increase visibility and reach.",
      icon: "trending-up",
      problemSolved: "Great products or services go unnoticed because businesses don't know how to reach their target audience effectively online.",
      whatWeProvide: "Ad campaign planning, target audience research, ad creative design, copy drafting, budget planning, and analytics tracking setup for platforms like Facebook, Instagram, or Google.",
      expectedProcess: "1. Audience and goals definition. 2. Creative development (graphics/ad copy). 3. Campaign setup and launch. 4. Ongoing optimization and performance reports.",
      faqs: [
        { q: "Do you provide the ad budget?", a: "No, the advertising budget is paid directly to the ad platforms (Meta, Google) by the client. We manage and optimize that budget." },
        { q: "How do I know if my ads are working?", a: "We set up tracking so you can see exactly how many clicks, leads, and inquiries are generated from your budget, and provide clear bi-weekly summaries." }
      ]
    },
    {
      id: "flyer-design",
      name: "Flyer & Collateral Design",
      category: "creative",
      description: "Professional promotional materials for communicating offers, events and business messages.",
      icon: "file-text",
      problemSolved: "Offers and events fail to attract attention because of cluttered, amateur, or unclear promotional flyers.",
      whatWeProvide: "Eye-catching, professional design for digital flyers (social media) and print materials, with clear typography, content hierarchy, and strong calls-to-action.",
      expectedProcess: "1. Outline text, key offer details, and branding guidelines. 2. Draft design concepts. 3. Revisions and final file prep.",
      faqs: [
        { q: "Can you help write the text for my flyer?", a: "Yes, we refine your raw text to make sure it is punchy, clear, and leads to conversions." },
        { q: "Do you handle the printing?", a: "We deliver digital print-ready PDFs with correct margins and bleeds. You can send these to any commercial printer or use them on social media." }
      ]
    },
    {
      id: "business-readiness-support",
      name: "Startup & Funding Readiness Support",
      category: "strategic",
      description: "Analyzing business ideas, readiness, and mapping requirements for strategic growth support.",
      icon: "shield",
      problemSolved: "Startups fail to attract funding or long-term partners because their business structure, records, or plans are incomplete or unproven.",
      whatWeProvide: "Business readiness evaluation, assistance in compiling necessary startup documentation, strategic roadmap development, and structured business planning support.",
      expectedProcess: "1. Business Readiness Assessment completion. 2. Detailed gap analysis of business records and metrics. 3. Implementation of corrective measures and business structuring.",
      faqs: [
        { q: "Do you guarantee that my business will get funding?", a: "No, we do not guarantee funding or represent a financial regulator. We provide strategic advisory and packaging support to make your business attractive to potential funders." },
        { q: "What parameters do you look at to assess readiness?", a: "We analyze team competence, business stage, operational structure, financial record keeping, and market viability." }
      ]
    }
  ],
  resources: [
    {
      id: "resource-1",
      title: "How to Know Whether Your Business Idea Is Ready",
      category: "Starting a Business",
      summary: "A practical guide to validating your business concept before spending time and money building it.",
      content: "### Introduction\n\nMany entrepreneurs rush into launching a business simply because they have a great idea. However, an idea is only 5% of the battle. The other 95% is viability, execution, and timing.\n\nHere are three simple tests to evaluate if your business idea is ready:\n\n#### 1. The Problem Test\nDoes your idea solve a clear, specific problem that people are *already* trying to solve? If users aren't seeking solutions or complaining about the current state, they might not be willing to pay for your alternative.\n\n#### 2. The Customer Willingness-to-Pay Test\nTalk to ten potential customers. Do not ask, 'Would you buy this?' Ask, 'What have you spent money on in the last 30 days to solve this problem?' Genuine willingness-to-pay is demonstrated by past behavior, not hypothetical future support.\n\n#### 3. The Execution Test\nDo you have the necessary skills, team, or capital to build the first basic version (MVP)? If it requires a million-dollar platform to test, your idea isn't ready. Start smaller.",
      author: "Blessing Udechukwu",
      createdAt: "2026-08-01T10:00:00Z"
    },
    {
      id: "resource-2",
      title: "7 Things Every Small Business Needs Before Seeking Growth Support",
      category: "Business Growth",
      summary: "A checklist of documents, tools, and processes required to show you are ready to scale or seek partnerships.",
      content: "### Scalability and Growth Readiness\n\nWhen looking for strategic support, partnerships, or funding, businesses need to show they are organized. Here are the 7 core pillars you should establish:\n\n1. **Registered Entity**: Proper legal incorporation of your business.\n2. **Separated Finances**: A dedicated business bank account. Never mix personal and business funds.\n3. **Clear Value Proposition**: A 2-sentence summary explaining why customers choose you over competitors.\n4. **Documented Customer History**: A list of customers and transactions.\n5. **Basic Online Presence**: A website or professional domain that validates your existence.\n6. **Operational Workflow**: A clear step-by-step of how you deliver your service or product.\n7. **Specific Growth Goals**: Knowing exactly what you will spend money or resources on (e.g. hiring, marketing, inventory).",
      author: "Blessing Udechukwu",
      createdAt: "2026-08-10T12:00:00Z"
    },
    {
      id: "resource-3",
      title: "Why Your Business Needs a Professional Online Presence",
      category: "Digital Presence",
      summary: "How a professional website and logo build immediate trust and increase conversions for local and digital businesses.",
      content: "### First Impressions Count\n\nIn the digital age, your website is your digital storefront. If a client searches for your business and finds nothing, or a poorly designed Facebook page, they will assume you are either not serious or out of business.\n\n#### The Trust Factor\nA custom domain (e.g., `yourcompany.com`) and matching professional email (e.g., `contact@yourcompany.com`) show that you are an established, committed operation. It increases customer trust by over 70% compared to generic Gmail addresses and third-party portals.\n\n#### Control Your Narrative\nSocial media sites change their algorithms constantly. When you own your website, you own your database, control the visual style, and decide exactly how users learn about your services.",
      author: "Blessing Udechukwu",
      createdAt: "2026-08-15T09:30:00Z"
    }
  ],
  faqs: [
    {
      id: "faq-1",
      question: "What is Creative Solutions and how can it help my business?",
      answer: "Creative Solutions is an advisory and growth platform. We support entrepreneurs and businesses with strategic guidance, creative design, digital presence setup, and business readiness analysis to help you execute your goals successfully.",
      category: "General"
    },
    {
      id: "faq-2",
      question: "Do you offer direct funding, grants, or business loans?",
      answer: "We do not offer direct loans or guarantee funding. We analyze business readiness, structure your entity and documentation, and provide the strategic support needed to make your business viable for partnerships, loans, or startup investments.",
      category: "Strategic / Funding"
    },
    {
      id: "faq-3",
      question: "How do I get started with Creative Solutions?",
      answer: "We recommend starting in one of three ways: 1) Browse our services and book a 1-on-1 consultation, 2) Complete our interactive Business Readiness Assessment to get your growth report, or 3) Use our 'Ask Creative Solutions' AI assistant right here on the website to guide you.",
      category: "General"
    }
  ],
  testimonials: [
    {
      id: "test-1",
      clientName: "David K.",
      businessName: "EcoBuild Materials",
      text: "Blessing's guidance completely transformed how we structured our startup. The readiness assessment highlighted gaps in our financials that we resolved before reaching out to investors.",
      featured: true,
      image: ""
    },
    {
      id: "test-2",
      clientName: "Amina U.",
      businessName: "Nectar Beauty Solutions",
      text: "The website and logo designed by Creative Solutions gave us instant credibility. Our online inquiries increased by 40% in the first two months after launch.",
      featured: true,
      image: ""
    }
  ],
  caseStudies: [],
  portfolio: [
    {
      id: "port-1",
      title: "EcoBuild Brand Identity & Logo",
      description: "Clean, professional branding utilizing earth tones and strong typography for an sustainable construction supplier.",
      category: "logos",
      client: "EcoBuild Materials",
      image: "asset/port-1.png"
    },
    {
      id: "port-2",
      title: "Nectar Beauty E-commerce Hub",
      description: "A gorgeous, responsive business website designed to showcase cosmetic treatments and capture local bookings.",
      category: "websites",
      client: "Nectar Beauty Solutions",
      image: "asset/port-2.png"
    }
  ],
  aiKnowledge: [
    {
      id: "k-1",
      title: "Company Identity & Leadership",
      content: "Creative Solutions is owned by Blessing Udechukwu. The contact email is blessingaduba1@gmail.com. It is located in Nigeria but serves clients globally. Creative Solutions provides portfolio building, website building, logo design, professional strategy consultation, digital marketing/promotions, flyer design, and startup growth support.",
      category: "company"
    },
    {
      id: "k-2",
      title: "Funding Policy",
      content: "Creative Solutions does not guarantee funding, grant approvals, or loans. We do not distribute direct funds or operate as a financial institution. We prepare businesses for strategic growth and funding by analyzing readiness, refining business models, and building their digital brand and presentation.",
      category: "funding"
    }
  ],
  leads: [],
  consultations: [],
  analyticsEvents: []
};

let dbCache = null;

// Database operations
const db = {
  load() {
    if (dbCache) return dbCache;

    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
      // Seed default database
      const defaultData = JSON.parse(JSON.stringify(DEFAULT_DB));
      // Hash default password
      defaultData.settings.adminPasswordHash = bcrypt.hashSync('admin1234', 10);
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
      dbCache = defaultData;
      return dbCache;
    }

    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8');
      dbCache = JSON.parse(content);
      
      // Ensure all top-level keys exist (for schema safety)
      let needsSave = false;
      Object.keys(DEFAULT_DB).forEach(key => {
        if (!dbCache[key]) {
          dbCache[key] = JSON.parse(JSON.stringify(DEFAULT_DB[key]));
          needsSave = true;
        }
      });

      if (needsSave) {
        this.save();
      }

      return dbCache;
    } catch (error) {
      console.error("Error reading database file, loading backup or defaults:", error);
      if (fs.existsSync(BACKUP_PATH)) {
        try {
          const backupContent = fs.readFileSync(BACKUP_PATH, 'utf-8');
          dbCache = JSON.parse(backupContent);
          return dbCache;
        } catch (e) {
          console.error("Failed to load backup file as well:", e);
        }
      }
      // Fallback to memory defaults
      dbCache = JSON.parse(JSON.stringify(DEFAULT_DB));
      dbCache.settings.adminPasswordHash = bcrypt.hashSync('admin1234', 10);
      return dbCache;
    }
  },

  save() {
    if (!dbCache) return;
    try {
      const content = JSON.stringify(dbCache, null, 2);
      fs.writeFileSync(DB_PATH, content, 'utf-8');
      // Create backup copy asynchronously
      fs.writeFile(BACKUP_PATH, content, 'utf-8', (err) => {
        if (err) console.error("Database backup failed:", err);
      });
    } catch (error) {
      console.error("Failed to save database file:", error);
    }
  },

  getCollection(name) {
    this.load();
    return dbCache[name] || [];
  },

  getById(collectionName, id) {
    const list = this.getCollection(collectionName);
    return list.find(item => item.id === id);
  },

  insert(collectionName, item) {
    this.load();
    if (!dbCache[collectionName]) {
      dbCache[collectionName] = [];
    }
    const newItem = {
      id: item.id || uuidv4(),
      ...item,
      createdAt: item.createdAt || new Date().toISOString()
    };
    dbCache[collectionName].push(newItem);
    this.save();
    return newItem;
  },

  update(collectionName, id, updates) {
    this.load();
    const list = dbCache[collectionName] || [];
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return list[index];
    }
    return null;
  },

  delete(collectionName, id) {
    this.load();
    const list = dbCache[collectionName] || [];
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      const removed = list.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  },

  getSettings() {
    this.load();
    return dbCache.settings;
  },

  updateSettings(updates) {
    this.load();
    dbCache.settings = {
      ...dbCache.settings,
      ...updates
    };
    this.save();
    return dbCache.settings;
  }
};

module.exports = db;
