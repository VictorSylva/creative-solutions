document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('booking-form');
  const mainLayout = document.getElementById('booking-main-layout');
  const successMessage = document.getElementById('booking-success-message');

  if (!form || !mainLayout || !successMessage) return;

  // 1. Pre-populate default service from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const serviceParam = urlParams.get('service');
  
  if (serviceParam) {
    const serviceSelector = document.getElementById('book-service');
    if (serviceSelector) {
      // Map parameter IDs to option values
      const serviceMapping = {
        'website-building': 'Website Building',
        'logo-design': 'Logo Design',
        'portfolio-building': 'Portfolio Building',
        'consultation': 'General Strategy',
        'digital-advertising': 'Digital Promotions',
        'flyer-design': 'Flyer Design',
        'business-readiness-support': 'Startup Readiness'
      };
      
      const mappedVal = serviceMapping[serviceParam];
      if (mappedVal) {
        serviceSelector.value = mappedVal;
      }
    }
  }

  // 2. Pre-populate lead contact info from session caching (smart personalization)
  const cachedName = sessionStorage.getItem('cs_lead_name');
  const cachedEmail = sessionStorage.getItem('cs_lead_email');
  const cachedPhone = sessionStorage.getItem('cs_lead_phone');
  const cachedBusiness = sessionStorage.getItem('cs_lead_business');
  const cachedIndustry = sessionStorage.getItem('cs_lead_industry');

  if (cachedName) document.getElementById('book-name').value = cachedName;
  if (cachedEmail) document.getElementById('book-email').value = cachedEmail;
  if (cachedPhone) document.getElementById('book-phone').value = cachedPhone;
  if (cachedBusiness) document.getElementById('book-business').value = cachedBusiness;
  if (cachedIndustry) document.getElementById('book-industry').value = cachedIndustry;

  // Set minimum date picker selection to today
  const dateInput = document.getElementById('book-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
  }

  // 3. Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('book-name').value.trim();
    const email = document.getElementById('book-email').value.trim();
    const phone = document.getElementById('book-phone').value.trim();
    const businessName = document.getElementById('book-business').value.trim();
    const industry = document.getElementById('book-industry').value.trim();
    const businessStage = document.getElementById('book-stage').value;
    const serviceOfInterest = document.getElementById('book-service').value;
    const challenge = document.getElementById('book-challenge').value.trim();
    const goal = document.getElementById('book-goal').value.trim();
    const preferredDate = document.getElementById('book-date').value;
    const preferredTime = document.getElementById('book-time').value;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Scheduling Request...';
    }

    const payload = {
      name, email, phone, businessName, industry, businessStage,
      serviceOfInterest, challenge, goal, preferredDate, preferredTime
    };

    try {
      const res = await fetch('/api/consultations/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (data.success) {
        // Cache user info in session for next form/chat context
        sessionStorage.setItem('cs_lead_name', name);
        sessionStorage.setItem('cs_lead_email', email);
        sessionStorage.setItem('cs_lead_phone', phone);
        sessionStorage.setItem('cs_lead_business', businessName);
        sessionStorage.setItem('cs_lead_industry', industry);
        
        if (data.leadId) {
          sessionStorage.setItem('creative_solutions_lead_id', data.leadId);
        }

        // Transition views
        mainLayout.style.display = 'none';
        successMessage.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(data.error || "Booking failed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to request booking. Please check connection and try again.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book Strategy Consultation';
      }
    }
  });

  // Load custom WhatsApp link if API settings respond
  fetch('/api/settings')
    .then(res => res.json())
    .then(settings => {
      if (settings && settings.whatsapp) {
        const whatsappBtn = document.getElementById('booking-whatsapp-link');
        if (whatsappBtn) {
          whatsappBtn.href = settings.whatsapp;
        }
      }
    });
});
