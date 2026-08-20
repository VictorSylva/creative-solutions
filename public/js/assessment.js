document.addEventListener('DOMContentLoaded', () => {
  let currentStep = 1;
  const totalSteps = 4;

  const prevBtn = document.getElementById('assess-prev-btn');
  const nextBtn = document.getElementById('assess-next-btn');
  const form = document.getElementById('assessment-form');
  const wizardCard = document.getElementById('assessment-wizard-card');
  const resultsPanel = document.getElementById('assessment-results-panel');
  const progressFill = document.getElementById('assessment-progress-fill');

  if (!form || !wizardCard || !resultsPanel) return;

  // Track page view event specifically for assessment
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'assessment_start', page: 'assessment.html' })
  }).catch(err => console.error(err));

  // Initialize option-box select binds
  const setupOptionsSelect = (selector, inputId) => {
    const options = document.querySelectorAll(selector);
    const hiddenInput = document.getElementById(inputId);
    
    if (options.length === 0 || !hiddenInput) return;

    options.forEach(box => {
      box.addEventListener('click', () => {
        // Clear all selected in this scope
        options.forEach(b => b.classList.remove('selected'));
        // Add selected
        box.classList.add('selected');
        // Set value
        hiddenInput.value = box.getAttribute('data-value');
      });
    });
  };

  setupOptionsSelect('.wizard-step[data-step="1"] .option-box', 'assess-stage');
  setupOptionsSelect('.wizard-step[data-step="2"] .option-box', 'assess-revenue');

  const updateProgress = () => {
    const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
  };

  const showStep = (step) => {
    document.querySelectorAll('.wizard-step').forEach(el => {
      el.classList.remove('active');
    });
    const stepEl = document.querySelector(`.wizard-step[data-step="${step}"]`);
    if (stepEl) {
      stepEl.classList.add('active');
    }

    // Toggle nav buttons
    if (prevBtn) {
      prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
    }
    if (nextBtn) {
      nextBtn.textContent = step === totalSteps ? 'Submit Assessment' : 'Next Step';
    }

    updateProgress();
  };

  const validateStep = (step) => {
    if (step === 1) {
      const name = document.getElementById('assess-business').value.trim();
      const industry = document.getElementById('assess-industry').value.trim();
      const stage = document.getElementById('assess-stage').value;
      if (!name || !industry || !stage) {
        alert("Please specify your business name, industry, and current stage.");
        return false;
      }
    } else if (step === 2) {
      const duration = document.getElementById('assess-duration').value;
      const revenue = document.getElementById('assess-revenue').value;
      if (!duration || !revenue) {
        alert("Please answer all questions about operations and finance.");
        return false;
      }
    } else if (step === 3) {
      const challenge = document.getElementById('assess-challenge').value.trim();
      const goal = document.getElementById('assess-goal').value.trim();
      if (!challenge || !goal) {
        alert("Please describe your business challenge and short-term goal.");
        return false;
      }
    } else if (step === 4) {
      const name = document.getElementById('assess-name').value.trim();
      const email = document.getElementById('assess-email').value.trim();
      if (!name || !email) {
        alert("Please enter your name and email to receive the results.");
        return false;
      }
    }
    return true;
  };

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (!validateStep(currentStep)) return;

      if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
      } else {
        submitAssessment();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
      }
    });
  }

  const submitAssessment = async () => {
    // Collect all values
    const payload = {
      businessName: document.getElementById('assess-business').value.trim(),
      industry: document.getElementById('assess-industry').value.trim(),
      businessStage: document.getElementById('assess-stage').value,
      duration: document.getElementById('assess-duration').value,
      revenue: document.getElementById('assess-revenue').value,
      employees: document.getElementById('assess-employees').value,
      challenge: document.getElementById('assess-challenge').value.trim(),
      goal: document.getElementById('assess-goal').value.trim(),
      supportRequired: document.getElementById('assess-support').value,
      name: document.getElementById('assess-name').value.trim(),
      email: document.getElementById('assess-email').value.trim(),
      phone: document.getElementById('assess-phone').value.trim()
    };

    // Show loading text
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.textContent = 'Generating Profile...';
    }

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.result) {
        // Save lead details and ID to session storage for booking personalization
        sessionStorage.setItem('cs_lead_name', payload.name);
        sessionStorage.setItem('cs_lead_email', payload.email);
        sessionStorage.setItem('cs_lead_phone', payload.phone);
        sessionStorage.setItem('cs_lead_business', payload.businessName);
        sessionStorage.setItem('cs_lead_industry', payload.industry);
        
        if (data.leadId) {
          sessionStorage.setItem('creative_solutions_lead_id', data.leadId);
        }

        renderResults(data.result);
      } else {
        throw new Error(data.error || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating profile. Please check connections and try again.");
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.textContent = 'Submit Assessment';
      }
    }
  };

  const renderResults = (result) => {
    // Hide Form
    wizardCard.style.display = 'none';
    
    // Fill Results
    const stageBadge = document.getElementById('result-stage-badge');
    const strengthsList = document.getElementById('result-strengths-list');
    const improvementsList = document.getElementById('result-improvements-list');
    const servicesList = document.getElementById('recommended-services-list');

    if (stageBadge) stageBadge.textContent = result.stage;

    // Fill Strengths
    if (strengthsList) {
      strengthsList.innerHTML = result.strengths.length > 0 
        ? result.strengths.map(s => `<li>${s}</li>`).join('')
        : `<li>Initial planning: Startup has clear structural objectives.</li>`;
    }

    // Fill Improvements
    if (improvementsList) {
      improvementsList.innerHTML = result.improvements.length > 0 
        ? result.improvements.map(i => `<li>${i}</li>`).join('')
        : `<li>No immediate structural critical blocks found. Continue checking metrics.</li>`;
    }

    // Fill Recommended Services
    if (servicesList) {
      // Map service ID to readable name
      const serviceNames = {
        'portfolio-building': 'Portfolio Building',
        'website-building': 'Website Building',
        'logo-design': 'Logo Design',
        'consultation': 'Strategic Consultation',
        'digital-advertising': 'Digital Promotions & Ads',
        'flyer-design': 'Flyer & Collateral Design',
        'business-readiness-support': 'Startup Readiness Advisory'
      };

      servicesList.innerHTML = result.recommendedServices.map(id => `
        <div style="background-color: var(--color-white); border: 1px solid var(--color-border); padding: 1rem; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.9rem; font-weight: 500;">${serviceNames[id] || id}</span>
          <a href="services.html?service=${id}" class="value-link" style="font-size: 0.8rem;">View Details &rarr;</a>
        </div>
      `).join('');
    }

    // Reveal Results panel
    resultsPanel.style.display = 'block';
  };
});
