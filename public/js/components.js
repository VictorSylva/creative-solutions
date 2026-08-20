document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject Header Navigation
  const header = document.querySelector('header');
  if (header) {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    
    header.innerHTML = `
      <div class="nav-container">
        <a href="index.html" class="logo"><img src="asset/logo6.png" alt="Creative Solutions Logo" /></a>
        <nav>
          <ul class="nav-links">
            <li><a href="index.html" class="${currentPath === 'index.html' ? 'active' : ''}">Home</a></li>
            <li><a href="about.html" class="${currentPath === 'about.html' ? 'active' : ''}">About</a></li>
            <li><a href="services.html" class="${currentPath === 'services.html' ? 'active' : ''}">Services</a></li>
            <li><a href="portfolio.html" class="${currentPath === 'portfolio.html' ? 'active' : ''}">Portfolio</a></li>
            <li><a href="resources.html" class="${currentPath === 'resources.html' ? 'active' : ''}">Resources</a></li>
            <li><a href="assessment.html" class="${currentPath === 'assessment.html' ? 'active' : ''}">Business Assessment</a></li>
            <li><a href="book.html" class="${currentPath === 'book.html' ? 'active' : ''}">Book Consultation</a></li>
            <li><a href="contact.html" class="${currentPath === 'contact.html' ? 'active' : ''}">Contact</a></li>
          </ul>
        </nav>
        <div class="menu-toggle" id="mobile-menu-toggle">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    // Mobile Menu Toggle
    const toggle = document.getElementById('mobile-menu-toggle');
    const navLinks = header.querySelector('.nav-links');
    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        toggle.classList.toggle('active');
      });
    }

    // Scroll effect
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // 2. Inject Footer
  const footer = document.querySelector('footer');
  if (footer) {
    footer.innerHTML = `
      <div class="container" style="padding-bottom: 0;">
        <div class="footer-grid">
          <div class="footer-brand">
            <h3>CREATIVE<span>SOLUTIONS</span></h3>
            <p>Empowering entrepreneurs, startups, and small businesses with strategic guidance, website building, logo design, and growth solutions.</p>
          </div>
          <div class="footer-col">
            <h4>Capabilities</h4>
            <ul class="footer-links">
              <li><a href="services.html?service=website-building">Website Building</a></li>
              <li><a href="services.html?service=logo-design">Logo Design</a></li>
              <li><a href="services.html?service=portfolio-building">Portfolio Building</a></li>
              <li><a href="services.html?service=consultation">Strategic Consultation</a></li>
              <li><a href="services.html?service=digital-advertising">Digital Promotions</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Value Engine</h4>
            <ul class="footer-links">
              <li><a href="assessment.html">Business Assessment</a></li>
              <li><a href="resources.html">Resources & Articles</a></li>
              <li><a href="book.html">Book Strategy Session</a></li>
              <li><a href="index.html#faqs">Frequently Asked Questions</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Contact</h4>
            <ul class="footer-links">
              <li><a href="mailto:blessingaduba1@gmail.com">blessingaduba1@gmail.com</a></li>
              <li id="footer-phone"><a href="tel:+2348123456789">+234 812 345 6789</a></li>
              <li id="footer-whatsapp"><a href="https://wa.me/2348123456789" target="_blank">WhatsApp Chat</a></li>
              <li><a href="admin.html" style="font-size: 0.8rem; opacity: 0.5;">Admin Console</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 Creative Solutions. All rights reserved.</p>
          <div class="social-icons" id="footer-social-icons">
            <a href="#" target="_blank">Facebook</a>
            <a href="#" target="_blank">Instagram</a>
            <a href="#" target="_blank">LinkedIn</a>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Inject Floating AI Chat Widget
  const chatWidget = document.createElement('div');
  chatWidget.className = 'ai-chat-widget';
  chatWidget.innerHTML = `
    <button class="chat-trigger" id="chat-widget-trigger" aria-label="Ask Creative Solutions">
      <svg class="chat-icon" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
      </svg>
      <span class="close-icon" style="font-size: 1.5rem; font-weight: bold;">✕</span>
    </button>
    <div class="chat-window" id="chat-widget-window">
      <div class="chat-header">
        <div>
          <h4>Ask Creative Solutions</h4>
          <p>Online AI Assistant</p>
        </div>
      </div>
      <div class="chat-messages" id="chat-widget-messages">
        <div class="chat-bubble bot">
          Hello! I'm the Creative Solutions advisor. Whether you are validating a business idea, seeking professional branding, or planning a website, I can guide you. Ask me anything!
        </div>
      </div>
      <div class="chat-typing-indicator" id="chat-widget-typing">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="chat-input-area">
        <input type="text" id="chat-widget-input" placeholder="How do I grow my business?" autocomplete="off" />
        <button class="chat-send-btn" id="chat-widget-send" aria-label="Send message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(chatWidget);

  // Toggle Chat window open/close
  const trigger = document.getElementById('chat-widget-trigger');
  const windowEl = document.getElementById('chat-widget-window');
  if (trigger && windowEl) {
    trigger.addEventListener('click', () => {
      chatWidget.classList.toggle('open');
      if (chatWidget.classList.contains('open')) {
        // Track chat open analytics event
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'chat_open', page: window.location.pathname })
        }).catch(err => console.error(err));
        
        // Focus input
        setTimeout(() => {
          document.getElementById('chat-widget-input').focus();
        }, 100);
      }
    });
  }

  // Load business contact info into footer if API responds
  fetch('/api/settings')
    .then(res => res.json())
    .then(settings => {
      if (settings) {
        const phoneEl = document.getElementById('footer-phone');
        const whatsappEl = document.getElementById('footer-whatsapp');
        const socialEl = document.getElementById('footer-social-icons');
        
        if (phoneEl && settings.phone) {
          phoneEl.innerHTML = `<a href="tel:${settings.phone.replace(/\s+/g, '')}">${settings.phone}</a>`;
        }
        if (whatsappEl && settings.whatsapp) {
          whatsappEl.innerHTML = `<a href="${settings.whatsapp}" target="_blank">WhatsApp Chat</a>`;
        }
        
        if (socialEl && settings.socialLinks) {
          socialEl.innerHTML = `
            ${settings.socialLinks.facebook ? `<a href="${settings.socialLinks.facebook}" target="_blank">Facebook</a>` : ''}
            ${settings.socialLinks.instagram ? `<a href="${settings.socialLinks.instagram}" target="_blank">Instagram</a>` : ''}
            ${settings.socialLinks.linkedin ? `<a href="${settings.socialLinks.linkedin}" target="_blank">LinkedIn</a>` : ''}
            ${settings.socialLinks.twitter ? `<a href="${settings.socialLinks.twitter}" target="_blank">Twitter</a>` : ''}
          `;
        }
      }
    })
    .catch(err => console.error("Error setting custom footer details:", err));
});
