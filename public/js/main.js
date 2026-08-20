document.addEventListener('DOMContentLoaded', () => {
  // 1. Page View Tracking
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'page_view', page: currentPath })
  }).catch(err => console.error("Analytics error:", err));

  // 2. Page Specific Code Loading
  if (currentPath === 'index.html') {
    initHomepage();
  } else if (currentPath === 'services.html') {
    initServicesPage();
  } else if (currentPath === 'portfolio.html') {
    initPortfolioPage();
  } else if (currentPath === 'resources.html') {
    initResourcesPage();
  } else if (currentPath === 'contact.html') {
    initContactPage();
  }
});

// ==========================================
// HOMEPAGE LOGIC
// ==========================================
function initHomepage() {
  // Load Services Teaser
  fetch('/api/services')
    .then(res => res.json())
    .then(services => {
      const grid = document.getElementById('home-services-grid');
      if (grid && services.length > 0) {
        grid.innerHTML = services.slice(0, 6).map(s => `
          <div class="service-card">
            <div class="icon-box">
              <span style="font-size: 1.5rem; font-weight: bold;">
                ${s.icon === 'globe' ? '🌐' : s.icon === 'palette' ? '🎨' : s.icon === 'users' ? '👥' : s.icon === 'trending-up' ? '📈' : s.icon === 'file-text' ? '📄' : s.icon === 'briefcase' ? '💼' : '⚙️'}
              </span>
            </div>
            <h3>${s.name}</h3>
            <p>${s.description}</p>
            <a href="services.html?service=${s.id}" class="value-link">Learn More &rarr;</a>
          </div>
        `).join('');
      }
    });

  // Load Testimonials
  fetch('/api/testimonials')
    .then(res => res.json())
    .then(testimonials => {
      const container = document.getElementById('home-testimonials-container');
      if (container && testimonials.length > 0) {
        container.innerHTML = testimonials.map(t => `
          <div class="testimonial-card">
            <p class="testimonial-text">"${t.text}"</p>
            <div class="testimonial-client">
              ${t.clientName}
              <span>&ndash; ${t.businessName}</span>
            </div>
          </div>
        `).join('');
      }
    });

  // Load FAQs
  fetch('/api/faqs')
    .then(res => res.json())
    .then(faqs => {
      const list = document.getElementById('home-faq-list');
      if (list && faqs.length > 0) {
        list.innerHTML = faqs.map(f => `
          <div class="service-faq-item">
            <div class="service-faq-q" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
              <span>${f.question}</span>
              <span>+</span>
            </div>
            <p class="service-faq-a" style="display: none; padding-top: 0.5rem;">${f.answer}</p>
          </div>
        `).join('');
      }
    });

  // Audience Tabs Interaction
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// ==========================================
// SERVICES PAGE LOGIC
// ==========================================
function initServicesPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get('service');
  const mainContainer = document.getElementById('services-main-container');

  if (!mainContainer) return;

  if (serviceId) {
    // Render Individual Service Details
    fetch(`/api/services/${serviceId}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(service => {
        // Track service view
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'service_view', page: service.id })
        });

        document.getElementById('services-header-title').textContent = service.name;
        document.getElementById('services-header-desc').textContent = service.description;

        mainContainer.innerHTML = `
          <div class="service-detail-grid">
            <div class="service-content-main">
              <h2>The Problem We Solve</h2>
              <p>${service.problemSolved}</p>

              <h2>What We Provide</h2>
              <p>${service.whatWeProvide}</p>

              <h2>Our Delivery Process</h2>
              <p>${service.expectedProcess}</p>

              ${service.faqs && service.faqs.length > 0 ? `
                <h2 style="margin-top: 3rem;">Frequently Asked Questions</h2>
                <div class="service-faqs-list" style="margin-top: 1rem;">
                  ${service.faqs.map(faq => `
                    <div class="service-faq-item">
                      <div class="service-faq-q" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                        <span>${faq.q}</span>
                        <span>+</span>
                      </div>
                      <p class="service-faq-a" style="display: none; padding-top: 0.5rem;">${faq.a}</p>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>

            <div class="service-sidebar">
              <div class="service-sidebar-card">
                <h3>Ready to discuss this solution?</h3>
                <p style="font-size: 0.9rem; margin-top: 0.5rem; margin-bottom: 1.8rem;">
                  Book a strategic consultation with Blessing Udechukwu. We will outline a customized plan based on your business stage.
                </p>
                <a href="book.html?service=${service.id}" class="btn btn-primary" style="width: 100%;">Book Consultation</a>
                <button onclick="document.getElementById('chat-widget-trigger').click();" class="btn btn-secondary" style="width: 100%; margin-top: 0.8rem;">Ask AI Assistant</button>
              </div>
            </div>
          </div>
        `;
      })
      .catch(() => {
        mainContainer.innerHTML = `
          <div style="text-align: center; padding: 4rem 0;">
            <h2>Service Not Found</h2>
            <p style="margin-top: 1rem;"><a href="services.html" class="btn btn-primary">Back to Services</a></p>
          </div>
        `;
      });
  } else {
    // Render Full Services Directory
    fetch('/api/services')
      .then(res => res.json())
      .then(services => {
        document.getElementById('services-header-title').textContent = "Our Strategic & Creative Solutions";
        document.getElementById('services-header-desc').textContent = "We support startups, entrepreneurs, and established businesses through tailored digital design and growth consulting.";

        mainContainer.innerHTML = `
          <div class="grid-3" style="margin-top: 2rem;">
            ${services.map(s => `
              <div class="service-card">
                <div class="icon-box">
                  <span style="font-size: 1.5rem; font-weight: bold;">
                    ${s.icon === 'globe' ? '🌐' : s.icon === 'palette' ? '🎨' : s.icon === 'users' ? '👥' : s.icon === 'trending-up' ? '📈' : s.icon === 'file-text' ? '📄' : s.icon === 'briefcase' ? '💼' : '⚙️'}
                  </span>
                </div>
                <h3>${s.name}</h3>
                <p>${s.description}</p>
                <a href="services.html?service=${s.id}" class="value-link">Learn More &rarr;</a>
              </div>
            `).join('')}
          </div>
        `;
      });
  }
}

// ==========================================
// PORTFOLIO PAGE LOGIC
// ==========================================
function initPortfolioPage() {
  const grid = document.getElementById('portfolio-grid');
  const filtersContainer = document.getElementById('portfolio-filters');
  
  if (!grid) return;

  fetch('/api/portfolio')
    .then(res => res.json())
    .then(projects => {
      // Gather active categories
      const categories = ['all', ...new Set(projects.map(p => p.category))];
      
      // Render Category Filters
      if (filtersContainer) {
        filtersContainer.innerHTML = categories.map(c => `
          <button class="filter-btn ${c === 'all' ? 'active' : ''}" data-filter="${c}">
            ${c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        `).join('');

        // Filter Click Bindings
        const filterBtns = filtersContainer.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterVal = btn.getAttribute('data-filter');
            renderCards(filterVal);
          });
        });
      }

      // Render Cards Function
      const renderCards = (filter = 'all') => {
        const filtered = filter === 'all' ? projects : projects.filter(p => p.category === filter);
        
        if (filtered.length === 0) {
          grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem 0; color: var(--color-gray);">No projects published yet.</div>`;
          return;
        }

        grid.innerHTML = filtered.map(p => `
          <div class="portfolio-card">
            <div class="portfolio-img-placeholder">
              ${p.image ? `<img src="${p.image}" alt="${p.title}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<span>🖼️ ${p.title}</span>`}
            </div>
            <div class="portfolio-info">
              <div class="portfolio-category">${p.category}</div>
              <h3>${p.title}</h3>
              <p style="font-size: 0.9rem; margin-bottom: 0;">${p.description}</p>
              <div style="margin-top: 1rem; font-size: 0.8rem; color: var(--color-gray);">Client: <strong>${p.client}</strong></div>
            </div>
          </div>
        `).join('');
      };

      // Initial render
      renderCards();
    });
}

// ==========================================
// RESOURCES CENTRE LOGIC
// ==========================================
function initResourcesPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');
  const mainContainer = document.getElementById('resources-main-container');

  if (!mainContainer) return;

  if (articleId) {
    // Render specific article details
    fetch(`/api/resources/${articleId}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(article => {
        document.getElementById('resources-header-title').textContent = article.title;
        document.getElementById('resources-header-desc').textContent = `Category: ${article.category} | By ${article.author}`;

        // Simple markdown parsing for article details
        let parsedContent = article.content
          .replace(/### (.*)/g, '<h3>$1</h3>')
          .replace(/#### (.*)/g, '<h4>$1</h4>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br/>');

        mainContainer.innerHTML = `
          <div style="max-width: 700px; margin: 0 auto; background-color: var(--color-white); border: 1px solid var(--color-border); padding: 3.5rem; border-radius: var(--radius-sm); box-shadow: var(--shadow-subtle);">
            <div class="resource-meta">
              <span>Category: ${article.category}</span>
              <span>Published: ${new Date(article.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="article-body-html" style="font-weight: 300; font-size: 1.1rem; line-height: 1.8;">
              <p>${parsedContent}</p>
            </div>
            <hr style="border: none; border-top: 1px solid var(--color-border); margin: 3rem 0;"/>
            <div style="text-align: center;">
              <h4>Want to discuss this topic further?</h4>
              <p style="font-size: 0.95rem; margin-top: 0.5rem; margin-bottom: 1.5rem;">Book a session with us or use our Business Assessment tool to review your startup readiness.</p>
              <a href="book.html" class="btn btn-primary">Book Consultation</a>
              <a href="assessment.html" class="btn btn-secondary">Run Assessment</a>
            </div>
          </div>
        `;
      })
      .catch(() => {
        mainContainer.innerHTML = `<div style="text-align: center; padding: 4rem 0;"><h2>Article Not Found</h2><p style="margin-top: 1rem;"><a href="resources.html" class="btn btn-primary">Back to Resources</a></p></div>`;
      });
  } else {
    // Render full resource feed
    fetch('/api/resources')
      .then(res => res.json())
      .then(resources => {
        document.getElementById('resources-header-title').textContent = "Resource & Knowledge Centre";
        document.getElementById('resources-header-desc').textContent = "Explore strategic guides, business tools, templates, and advice curated to guide startup validation and scaling.";

        if (resources.length === 0) {
          mainContainer.innerHTML = `<div style="text-align: center; padding: 4rem 0; color: var(--color-gray);">No resource articles published yet.</div>`;
          return;
        }

        mainContainer.innerHTML = `
          <div class="grid-3" style="margin-top: 2rem;">
            ${resources.map(r => `
              <div class="resource-card">
                <div class="resource-meta">
                  <span>${r.category}</span>
                </div>
                <h3>${r.title}</h3>
                <p style="font-size: 0.9rem; margin-bottom: 1.5rem;">${r.summary}</p>
                <a href="resources.html?id=${r.id}" class="value-link">Read Full Guide &rarr;</a>
              </div>
            `).join('')}
          </div>
        `;
      });
  }
}

// ==========================================
// CONTACT PAGE FORM SUBMISSION
// ==========================================
function initContactPage() {
  const form = document.getElementById('contact-form');
  const responseMsg = document.getElementById('contact-response-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const businessName = document.getElementById('contact-business').value.trim();
    const message = document.getElementById('contact-message').value.trim();

    if (!name || !email) {
      if (responseMsg) {
        responseMsg.className = 'error';
        responseMsg.textContent = 'Please fill in Name and Email.';
      }
      return;
    }

    try {
      // Re-use booking/leads backend for lead capture
      const response = await fetch('/api/consultations/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          businessName,
          challenge: message,
          goal: 'Direct contact request',
          serviceOfInterest: 'General inquiry',
          preferredDate: new Date().toISOString().split('T')[0], // placeholder date
          preferredTime: '00:00'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Save lead ID to session storage
        if (data.leadId) {
          sessionStorage.setItem('creative_solutions_lead_id', data.leadId);
        }

        form.reset();
        if (responseMsg) {
          responseMsg.style.display = 'block';
          responseMsg.style.color = '#3aa65c';
          responseMsg.textContent = 'Thank you! Your message has been sent. Blessing Udechukwu will contact you shortly.';
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error(err);
      if (responseMsg) {
        responseMsg.style.display = 'block';
        responseMsg.style.color = '#a63a3a';
        responseMsg.textContent = 'Could not send message. Please double check details or email blessingaduba1@gmail.com directly.';
      }
    }
  });
}
