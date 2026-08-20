document.addEventListener('DOMContentLoaded', () => {
  // Authentication states
  let token = localStorage.getItem('cs_admin_token') || null;

  const loginOverlay = document.getElementById('admin-login-overlay');
  const layoutWrap = document.getElementById('admin-layout-wrap');
  const loginForm = document.getElementById('admin-login-form');
  const loginError = document.getElementById('login-error');

  const logoutBtn = document.getElementById('admin-logout-btn');

  // Verify auth on startup
  if (token) {
    showDashboard();
  } else {
    loginOverlay.style.display = 'flex';
    layoutWrap.style.display = 'none';
  }

  // Handle Admin Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('login-password').value;
      
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Authenticating...';

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        
        if (res.ok && data.token) {
          token = data.token;
          localStorage.setItem('cs_admin_token', token);
          loginError.style.display = 'none';
          loginForm.reset();
          showDashboard();
        } else {
          throw new Error(data.error || 'Invalid credentials');
        }
      } catch (err) {
        console.error(err);
        loginError.style.display = 'block';
        loginError.textContent = err.message || 'Login failed';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login to Dashboard';
      }
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      token = null;
      localStorage.removeItem('cs_admin_token');
      loginOverlay.style.display = 'flex';
      layoutWrap.style.display = 'none';
    });
  }

  function showDashboard() {
    loginOverlay.style.display = 'none';
    layoutWrap.style.display = 'flex';
    initAdminNavigation();
    loadDashboardPanel();
  }

  // Helper fetch wrapper for Authorization headers
  async function adminFetch(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    };
    
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      // Auto logout if token expired
      token = null;
      localStorage.removeItem('cs_admin_token');
      loginOverlay.style.display = 'flex';
      layoutWrap.style.display = 'none';
      throw new Error("Session expired. Please log in again.");
    }
    
    return res;
  }

  // ==========================================
  // NAVIGATION SETUP
  // ==========================================
  const sidebarLinks = document.querySelectorAll('.sidebar-menu a');
  const panels = document.querySelectorAll('.admin-panel');
  const mainTitle = document.getElementById('admin-title');

  function initAdminNavigation() {
    sidebarLinks.forEach(link => {
      // Avoid duplicate binding if already set
      if (link.dataset.navBound) return;
      link.dataset.navBound = true;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        sidebarLinks.forEach(l => l.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        link.classList.add('active');
        const targetPanel = link.getAttribute('data-panel');
        document.getElementById(targetPanel).classList.add('active');

        // Update titles & load relevant data
        if (targetPanel === 'panel-dashboard') {
          mainTitle.textContent = "Dashboard Overview";
          loadDashboardPanel();
        } else if (targetPanel === 'panel-crm') {
          mainTitle.textContent = "CRM Pipeline";
          loadCrmPanel();
        } else if (targetPanel === 'panel-content') {
          mainTitle.textContent = "Content Manager";
          loadContentPanel();
        } else if (targetPanel === 'panel-settings') {
          mainTitle.textContent = "System Settings";
          loadSettingsPanel();
        }
      });
    });
  }

  // ==========================================
  // PANEL 1: DASHBOARD LOADER
  // ==========================================
  async function loadDashboardPanel() {
    try {
      // Fetch stats
      const statsRes = await adminFetch('/api/admin/analytics');
      const stats = await statsRes.json();

      document.getElementById('metric-pageviews').textContent = stats.totalPageViews;
      document.getElementById('metric-leads').textContent = stats.totalLeads;
      document.getElementById('metric-consultations').textContent = stats.totalConsultations;
      document.getElementById('metric-assessments').textContent = stats.assessmentsCompleted;

      // Render Popular Services bars
      const servContainer = document.getElementById('analytics-services-interest');
      if (servContainer) {
        const views = stats.serviceInterests || {};
        const serviceNames = {
          'website-building': 'Website Building',
          'logo-design': 'Logo Design',
          'portfolio-building': 'Portfolio Building',
          'consultation': 'Strategic Consultation',
          'digital-advertising': 'Digital Advertising',
          'flyer-design': 'Flyer Design',
          'business-readiness-support': 'Startup Readiness Advisory'
        };

        const entries = Object.entries(views).sort((a,b) => b[1] - a[1]);
        if (entries.length > 0) {
          const maxVal = Math.max(...entries.map(e => e[1]));
          servContainer.innerHTML = entries.map(([id, val]) => `
            <div style="font-size: 0.9rem; margin-bottom: 0.5rem;">
              <div style="display: flex; justify-content: space-between; font-weight: 500;">
                <span>${serviceNames[id] || id}</span>
                <span>${val} views</span>
              </div>
              <div style="width: 100%; height: 6px; background-color: var(--color-zinc-200); border-radius: 3px; overflow: hidden; margin-top: 0.25rem;">
                <div style="width: ${(val / maxVal) * 100}%; height: 100%; background-color: var(--color-accent); border-radius: 3px;"></div>
              </div>
            </div>
          `).join('');
        } else {
          servContainer.innerHTML = `<p style="color: var(--color-gray); font-size: 0.9rem;">No service views logged yet.</p>`;
        }
      }

      // Fetch upcoming bookings
      const consRes = await adminFetch('/api/admin/consultations');
      const consultations = await consRes.json();
      const consList = document.getElementById('dashboard-consultations-list');

      if (consList) {
        const upcoming = consultations.filter(c => c.status === 'requested' || c.status === 'confirmed').slice(0, 5);
        if (upcoming.length > 0) {
          consList.innerHTML = upcoming.map(c => `
            <div style="background-color: var(--color-zinc-100); border: 1px solid var(--color-border); padding: 1rem; border-radius: var(--radius-sm); font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; font-weight: 500;">
                <span>${c.leadName} (${c.businessName || 'No Business'})</span>
                <span style="color: var(--color-accent);">${c.preferredDate} @ ${c.preferredTime}</span>
              </div>
              <div style="font-size: 0.8rem; color: var(--color-gray); margin-top: 0.25rem;">${c.notes}</div>
            </div>
          `).join('');
        } else {
          consList.innerHTML = `<p style="color: var(--color-gray); font-size: 0.9rem;">No upcoming strategy sessions.</p>`;
        }
      }

      // Fetch AI Insights
      const insightsRes = await adminFetch('/api/admin/insights');
      const insights = await insightsRes.json();

      document.getElementById('insight-summary').textContent = insights.summary;
      document.getElementById('insight-questions').innerHTML = insights.commonQuestions
        .replace(/\n/g, '<br/>')
        .replace(/(\d+\.\s+)/g, '<strong>$1</strong>');
      document.getElementById('insight-action').textContent = insights.recommendedAction;

    } catch (err) {
      console.error(err);
    }
  }

  // ==========================================
  // PANEL 2: CRM KANBAN BOARD LOADER
  // ==========================================
  let leadsData = [];

  async function loadCrmPanel() {
    try {
      const res = await adminFetch('/api/admin/leads');
      leadsData = await res.json();
      renderKanbanBoard();
    } catch (err) {
      console.error(err);
    }
  }

  function renderKanbanBoard() {
    // Clear columns
    document.querySelectorAll('.crm-cards-list').forEach(list => {
      list.innerHTML = '';
    });

    const columnsCounts = {
      new: 0, contacted: 0, qualified: 0, consultation_booked: 0,
      consultation_completed: 0, proposal: 0, client: 0, completed: 0, closed: 0
    };

    leadsData.forEach(lead => {
      const colId = lead.status || 'new';
      const colList = document.querySelector(`.crm-column[data-status="${colId}"] .crm-cards-list`);
      
      if (colList) {
        columnsCounts[colId]++;
        
        const card = document.createElement('div');
        card.className = 'crm-lead-card';
        card.draggable = true;
        card.dataset.id = lead.id;
        
        card.innerHTML = `
          <div class="crm-lead-name">${lead.name}</div>
          <div class="crm-lead-business">${lead.businessName || 'No Business'}</div>
          
          <div class="crm-lead-badges">
            <span class="lead-badge badge-intent-${lead.intentScore ? lead.intentScore.toLowerCase() : 'low'}">${lead.intentScore || 'Low'} Intent</span>
            <span class="lead-badge badge-source">${lead.leadSource || 'Web'}</span>
          </div>

          <div style="margin-top: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
            <select class="form-control" style="font-size: 0.75rem; padding: 0.25rem; width: auto; min-width: 120px;" onchange="event.stopPropagation(); window.updateLeadStatus('${lead.id}', this.value)">
              <option value="new" ${colId === 'new' ? 'selected' : ''}>New</option>
              <option value="contacted" ${colId === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="qualified" ${colId === 'qualified' ? 'selected' : ''}>Qualified</option>
              <option value="consultation_booked" ${colId === 'consultation_booked' ? 'selected' : ''}>Booked</option>
              <option value="consultation_completed" ${colId === 'consultation_completed' ? 'selected' : ''}>Held</option>
              <option value="proposal" ${colId === 'proposal' ? 'selected' : ''}>Proposal</option>
              <option value="client" ${colId === 'client' ? 'selected' : ''}>Client Signed</option>
              <option value="completed" ${colId === 'completed' ? 'selected' : ''}>Closed Won</option>
              <option value="closed" ${colId === 'closed' ? 'selected' : ''}>Closed Lost</option>
            </select>
            <button class="value-link" style="border: none; background: none; font-size: 0.75rem; cursor: pointer;" onclick="event.stopPropagation(); window.openLeadDetails('${lead.id}')">View &rarr;</button>
          </div>
        `;

        // Bind drag start
        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', lead.id);
        });

        colList.appendChild(card);
      }
    });

    // Update numbers
    Object.entries(columnsCounts).forEach(([colId, count]) => {
      const countEl = document.getElementById(`count-${colId}`);
      if (countEl) countEl.textContent = count;
    });

    setupKanbanDragAndDrop();
  }

  // Expose status updater to window
  window.updateLeadStatus = async (leadId, newStatus) => {
    try {
      const res = await adminFetch(`/api/admin/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        loadCrmPanel();
      }
    } catch (err) {
      console.error(err);
    }
  };

  function setupKanbanDragAndDrop() {
    const columns = document.querySelectorAll('.crm-column');
    columns.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const status = col.getAttribute('data-status');
        if (id && status) {
          await window.updateLeadStatus(id, status);
        }
      });
    });
  }

  // ==========================================
  // LEAD DETAIL MODAL
  // ==========================================
  const detailsModal = document.getElementById('modal-lead-details');
  const detailsBody = document.getElementById('lead-modal-body');
  
  window.openLeadDetails = (leadId) => {
    const lead = leadsData.find(l => l.id === leadId);
    if (!lead || !detailsModal || !detailsBody) return;

    detailsModal.classList.add('open');
    renderLeadDetails(lead);
  };

  function renderLeadDetails(lead) {
    const assessmentHTML = lead.assessmentResult ? `
      <div style="background-color: var(--color-zinc-100); border: 1px solid var(--color-border); padding: 1.5rem; border-radius: var(--radius-sm); margin-top: 1rem;">
        <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem;">Business Assessment results (${lead.assessmentResult.stage})</h4>
        <div class="lead-detail-grid">
          <div>
            <strong>Industry:</strong> ${lead.assessmentResult.answers.industry || 'Unknown'}<br/>
            <strong>Employees:</strong> ${lead.assessmentResult.answers.employees || 'Unknown'}<br/>
            <strong>Goal:</strong> ${lead.assessmentResult.answers.goal || 'Unknown'}
          </div>
          <div>
            <strong>Revenue:</strong> ${lead.assessmentResult.answers.revenue || 'Unknown'}<br/>
            <strong>Existed:</strong> ${lead.assessmentResult.answers.duration || 'Unknown'}
          </div>
        </div>
        <div style="margin-top: 1rem;">
          <strong>Strengths:</strong>
          <ul style="padding-left: 1.2rem; font-size: 0.85rem;">
            ${lead.assessmentResult.strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        <div style="margin-top: 0.5rem;">
          <strong>Improvements Needed:</strong>
          <ul style="padding-left: 1.2rem; font-size: 0.85rem;">
            ${lead.assessmentResult.improvements.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
      </div>
    ` : '<p style="color: var(--color-gray); font-size: 0.9rem; margin-top: 0.5rem;">No interactive readiness assessment complete.</p>';

    const chatHTML = lead.chatSummary ? `
      <div style="background-color: var(--color-zinc-100); border: 1px solid var(--color-border); padding: 1.5rem; border-radius: var(--radius-sm); margin-top: 1rem;">
        <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem;">AI chatbot conversation summary</h4>
        <p style="font-size: 0.9rem; font-style: italic;">"${lead.chatSummary}"</p>
      </div>
    ` : '<p style="color: var(--color-gray); font-size: 0.9rem; margin-top: 0.5rem;">No chatbot transcripts recorded.</p>';

    detailsBody.innerHTML = `
      <div class="lead-detail-grid">
        <div class="lead-detail-section">
          <h4>Lead overview</h4>
          <p style="font-size: 0.95rem; line-height: 1.6;">
            <strong>Email:</strong> ${lead.email}<br/>
            <strong>Phone:</strong> ${lead.phone || 'None'}<br/>
            <strong>Business Stage:</strong> ${lead.businessStage || 'Unspecified'}<br/>
            <strong>Need Details:</strong> ${lead.need || 'None'}<br/>
            <strong>Created:</strong> ${new Date(lead.createdAt).toLocaleDateString()}
          </p>
        </div>
        
        <div class="lead-detail-section">
          <h4>Status controls</h4>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label>Current Stage</label>
            <select id="modal-lead-status-select" class="form-control" onchange="window.updateLeadStatus('${lead.id}', this.value); document.getElementById('modal-lead-details').classList.remove('open')">
              <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New</option>
              <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
              <option value="qualified" ${lead.status === 'qualified' ? 'selected' : ''}>Qualified</option>
              <option value="consultation_booked" ${lead.status === 'consultation_booked' ? 'selected' : ''}>Booked</option>
              <option value="consultation_completed" ${lead.status === 'consultation_completed' ? 'selected' : ''}>Held</option>
              <option value="proposal" ${lead.status === 'proposal' ? 'selected' : ''}>Proposal</option>
              <option value="client" ${lead.status === 'client' ? 'selected' : ''}>Client Signed</option>
              <option value="completed" ${lead.status === 'completed' ? 'selected' : ''}>Closed Won</option>
              <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>Closed Lost</option>
            </select>
          </div>
          <button class="btn btn-secondary" style="width: 100%; color: var(--color-danger); border-color: var(--color-danger);" onclick="window.deleteLead('${lead.id}')">Delete Lead Log</button>
        </div>
      </div>

      <div class="lead-detail-grid" style="margin-top: 2rem;">
        <div class="lead-detail-section">
          <h4>Business diagnostics</h4>
          ${assessmentHTML}
          
          <h4 style="margin-top: 2rem;">AI Assistant insights</h4>
          ${chatHTML}
        </div>

        <div class="lead-detail-section">
          <h4>Activity Timeline & Notes</h4>
          
          <form id="lead-note-form" onsubmit="event.preventDefault(); window.submitLeadNote('${lead.id}')" style="margin-top: 1rem;">
            <div class="form-group" style="margin-bottom: 0.8rem;">
              <textarea id="lead-note-input" class="form-control" placeholder="Add administrative note..." required></textarea>
            </div>
            <button type="submit" class="btn btn-dark" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Save Note</button>
          </form>

          <div class="notes-timeline" id="lead-notes-timeline">
            ${lead.notes && lead.notes.length > 0 ? lead.notes.map(n => `
              <div class="note-timeline-item">
                <div class="note-time">${new Date(n.createdAt).toLocaleString()}</div>
                <div style="margin-top: 0.25rem;">${n.text}</div>
              </div>
            `).reverse().join('') : '<div style="color: var(--color-gray); font-size: 0.85rem;">No administrative notes added.</div>'}
          </div>
        </div>
      </div>
    `;
  }

  // Note submission handler
  window.submitLeadNote = async (leadId) => {
    const input = document.getElementById('lead-note-input');
    const noteText = input.value.trim();
    if (!noteText) return;

    try {
      const res = await adminFetch(`/api/admin/leads/${leadId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ note: noteText })
      });
      const data = await res.json();
      if (data.success) {
        input.value = '';
        // Reload leads list and modal
        const leadsRes = await adminFetch('/api/admin/leads');
        leadsData = await leadsRes.json();
        const updatedLead = leadsData.find(l => l.id === leadId);
        if (updatedLead) renderLeadDetails(updatedLead);
        renderKanbanBoard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete lead handler
  window.deleteLead = async (leadId) => {
    if (!confirm("Are you sure you want to delete this lead from the database?")) return;

    try {
      const res = await adminFetch(`/api/admin/leads/${leadId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        detailsModal.classList.remove('open');
        loadCrmPanel();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // PANEL 3: CONTENT MANAGER CRUD
  // ==========================================
  let currentSubTab = 'services';
  let activeContentItems = [];
  let editingId = null;

  const contentSubBtns = document.querySelectorAll('.tab-sub-btn');
  const contentAddBtn = document.getElementById('content-add-btn');
  const tableHeaders = document.getElementById('content-table-headers');
  const tableRows = document.getElementById('content-table-rows');

  const contentFormModal = document.getElementById('modal-content-form');
  const fieldsContainer = document.getElementById('dynamic-form-fields-container');
  const contentForm = document.getElementById('admin-content-form-fields');
  const contentModalTitle = document.getElementById('content-modal-title');

  function loadContentPanel() {
    contentSubBtns.forEach(btn => {
      // Bind click
      if (btn.dataset.bound) return;
      btn.dataset.bound = true;

      btn.addEventListener('click', () => {
        contentSubBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSubTab = btn.getAttribute('data-sub').replace('content-', '');
        fetchContentItems();
      });
    });

    if (contentAddBtn && !contentAddBtn.dataset.bound) {
      contentAddBtn.dataset.bound = true;
      contentAddBtn.addEventListener('click', () => {
        editingId = null;
        contentModalTitle.textContent = `Add New ${capitalize(currentSubTab)}`;
        contentForm.reset();
        generateFormFields();
        contentFormModal.classList.add('open');
      });
    }

    fetchContentItems();
  }

  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

  async function fetchContentItems() {
    try {
      const res = await adminFetch(`/api/admin/${currentSubTab}`);
      activeContentItems = await res.json();
      renderContentTable();
    } catch (err) {
      console.error(err);
    }
  }

  function renderContentTable() {
    if (!tableHeaders || !tableRows) return;

    tableHeaders.innerHTML = '';
    tableRows.innerHTML = '';

    // Define table configurations based on sub-tab
    const configs = {
      services: {
        headers: ['Name', 'Category', 'Description', 'Actions'],
        rows: item => `
          <td><strong>${item.name}</strong></td>
          <td><span style="font-size:0.8rem; text-transform:uppercase; background:#e4e4e7; padding:0.2rem 0.5rem; border-radius:3px;">${item.category}</span></td>
          <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.description}</td>
        `
      },
      resources: {
        headers: ['Title', 'Category', 'Author', 'Created', 'Actions'],
        rows: item => `
          <td><strong>${item.title}</strong></td>
          <td>${item.category}</td>
          <td>${item.author}</td>
          <td>${new Date(item.createdAt).toLocaleDateString()}</td>
        `
      },
      faqs: {
        headers: ['Question', 'Category', 'Actions'],
        rows: item => `
          <td><strong>${item.question}</strong></td>
          <td>${item.category}</td>
        `
      },
      testimonials: {
        headers: ['Client', 'Business', 'Text', 'Featured', 'Actions'],
        rows: item => `
          <td><strong>${item.clientName}</strong></td>
          <td>${item.businessName}</td>
          <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.text}</td>
          <td>${item.featured ? '★ Yes' : 'No'}</td>
        `
      },
      portfolio: {
        headers: ['Title', 'Category', 'Client', 'Actions'],
        rows: item => `
          <td><strong>${item.title}</strong></td>
          <td>${item.category}</td>
          <td>${item.client}</td>
        `
      },
      aiKnowledge: {
        headers: ['Topic / Title', 'Content Brief', 'Category', 'Actions'],
        rows: item => `
          <td><strong>${item.title}</strong></td>
          <td style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.content}</td>
          <td>${item.category}</td>
        `
      }
    };

    const config = configs[currentSubTab];
    if (!config) return;

    // Set headers
    tableHeaders.innerHTML = config.headers.map(h => `<th>${h}</th>`).join('');

    // Set rows
    if (activeContentItems.length === 0) {
      tableRows.innerHTML = `<tr><td colspan="${config.headers.length}" style="text-align:center; color:var(--color-gray); padding:2rem 0;">No items added yet.</td></tr>`;
      return;
    }

    tableRows.innerHTML = activeContentItems.map(item => `
      <tr data-id="${item.id}">
        ${config.rows(item)}
        <td class="actions-cell">
          <button class="action-icon-btn edit" onclick="window.editContentItem('${item.id}')">✏️ Edit</button>
          <button class="action-icon-btn delete" onclick="window.deleteContentItem('${item.id}')">🗑️ Delete</button>
        </td>
      </tr>
    `).join('');
  }

  // Edit item handler
  window.editContentItem = (itemId) => {
    const item = activeContentItems.find(i => i.id === itemId);
    if (!item || !contentFormModal || !fieldsContainer) return;

    editingId = itemId;
    contentModalTitle.textContent = `Edit ${capitalize(currentSubTab)}`;
    generateFormFields(item);
    contentFormModal.classList.add('open');
  };

  // Delete item handler
  window.deleteContentItem = async (itemId) => {
    if (!confirm(`Are you sure you want to delete this ${currentSubTab} item?`)) return;

    try {
      const res = await adminFetch(`/api/admin/${currentSubTab}/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchContentItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate inputs based on active sub tab
  function generateFormFields(item = null) {
    if (!fieldsContainer) return;
    fieldsContainer.innerHTML = '';

    const val = (prop, fallback = '') => item ? (item[prop] || fallback) : fallback;

    if (currentSubTab === 'services') {
      fieldsContainer.innerHTML = `
        <div class="form-group">
          <label>Service ID (Slug style, e.g. web-design) *</label>
          <input type="text" id="field-id" class="form-control" value="${val('id')}" ${item ? 'disabled' : ''} required />
        </div>
        <div class="form-group">
          <label>Service Name *</label>
          <input type="text" id="field-name" class="form-control" value="${val('name')}" required />
        </div>
        <div class="form-group">
          <label>Category *</label>
          <select id="field-category" class="form-control" required>
            <option value="creative" ${val('category') === 'creative' ? 'selected' : ''}>Creative</option>
            <option value="digital" ${val('category') === 'digital' ? 'selected' : ''}>Digital</option>
            <option value="strategic" ${val('category') === 'strategic' ? 'selected' : ''}>Strategic</option>
          </select>
        </div>
        <div class="form-group">
          <label>Short Description (Grid card) *</label>
          <input type="text" id="field-description" class="form-control" value="${val('description')}" required />
        </div>
        <div class="form-group">
          <label>Icon Identifier</label>
          <input type="text" id="field-icon" class="form-control" placeholder="globe, palette, users..." value="${val('icon')}" />
        </div>
        <div class="form-group">
          <label>Detailed Problems Solved</label>
          <textarea id="field-problemSolved" class="form-control">${val('problemSolved')}</textarea>
        </div>
        <div class="form-group">
          <label>Detailed What We Deliver</label>
          <textarea id="field-whatWeProvide" class="form-control">${val('whatWeProvide')}</textarea>
        </div>
        <div class="form-group">
          <label>Expected Roadmap Process</label>
          <textarea id="field-expectedProcess" class="form-control">${val('expectedProcess')}</textarea>
        </div>
      `;
    } 
    else if (currentSubTab === 'resources') {
      fieldsContainer.innerHTML = `
        <div class="form-group">
          <label>Article Title *</label>
          <input type="text" id="field-title" class="form-control" value="${val('title')}" required />
        </div>
        <div class="form-group">
          <label>Topic Category *</label>
          <input type="text" id="field-category" class="form-control" value="${val('category')}" placeholder="Business Strategy, Branding..." required />
        </div>
        <div class="form-group">
          <label>Author *</label>
          <input type="text" id="field-author" class="form-control" value="${val('author', 'Blessing Udechukwu')}" required />
        </div>
        <div class="form-group">
          <label>Intro Summary (Grid preview) *</label>
          <textarea id="field-summary" class="form-control" required>${val('summary')}</textarea>
        </div>
        <div class="form-group">
          <label>Main Body Content (Supports markdown style lists/headings) *</label>
          <textarea id="field-content" class="form-control" style="min-height:220px;" required>${val('content')}</textarea>
        </div>
      `;
    }
    else if (currentSubTab === 'faqs') {
      fieldsContainer.innerHTML = `
        <div class="form-group">
          <label>Question *</label>
          <input type="text" id="field-question" class="form-control" value="${val('question')}" required />
        </div>
        <div class="form-group">
          <label>FAQ Category</label>
          <input type="text" id="field-category" class="form-control" value="${val('category', 'General')}" />
        </div>
        <div class="form-group">
          <label>Answer *</label>
          <textarea id="field-answer" class="form-control" required>${val('answer')}</textarea>
        </div>
      `;
    }
    else if (currentSubTab === 'testimonials') {
      fieldsContainer.innerHTML = `
        <div class="form-group">
          <label>Client Name *</label>
          <input type="text" id="field-clientName" class="form-control" value="${val('clientName')}" required />
        </div>
        <div class="form-group">
          <label>Business Name *</label>
          <input type="text" id="field-businessName" class="form-control" value="${val('businessName')}" required />
        </div>
        <div class="form-group">
          <label>Quote Text *</label>
          <textarea id="field-text" class="form-control" required>${val('text')}</textarea>
        </div>
        <div class="form-group" style="display:flex; align-items:center; gap:0.5rem;">
          <input type="checkbox" id="field-featured" ${item && item.featured ? 'checked' : ''} style="width:auto;" />
          <label for="field-featured" style="margin-bottom:0;">Feature on homepage</label>
        </div>
      `;
    }
    else if (currentSubTab === 'portfolio') {
      fieldsContainer.innerHTML = `
        <div class="form-group">
          <label>Project Title *</label>
          <input type="text" id="field-title" class="form-control" value="${val('title')}" required />
        </div>
        <div class="form-group">
          <label>Category *</label>
          <select id="field-category" class="form-control" required>
            <option value="websites" ${val('category') === 'websites' ? 'selected' : ''}>Websites</option>
            <option value="logos" ${val('category') === 'logos' ? 'selected' : ''}>Logos</option>
            <option value="portfolios" ${val('category') === 'portfolios' ? 'selected' : ''}>Portfolios</option>
            <option value="flyers" ${val('category') === 'flyers' ? 'selected' : ''}>Flyers</option>
            <option value="branding" ${val('category') === 'branding' ? 'selected' : ''}>Branding</option>
          </select>
        </div>
        <div class="form-group">
          <label>Client Name *</label>
          <input type="text" id="field-client" class="form-control" value="${val('client')}" required />
        </div>
        <div class="form-group">
          <label>Project Description</label>
          <textarea id="field-description" class="form-control">${val('description')}</textarea>
        </div>
      `;
    }
    else if (currentSubTab === 'aiKnowledge') {
      fieldsContainer.innerHTML = `
        <div class="form-group">
          <label>Knowledge Topic Title *</label>
          <input type="text" id="field-title" class="form-control" value="${val('title')}" placeholder="E.g., Pricing standards" required />
        </div>
        <div class="form-group">
          <label>Approved context details for chatbot *</label>
          <textarea id="field-content" class="form-control" style="min-height:180px;" required>${val('content')}</textarea>
        </div>
        <div class="form-group">
          <label>Category</label>
          <input type="text" id="field-category" class="form-control" value="${val('category', 'general')}" />
        </div>
      `;
    }
  }

  // Handle CRUD Form Submission
  if (contentForm) {
    contentForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Collect inputs dynamically
      const payload = {};
      const fields = fieldsContainer.querySelectorAll('input, textarea, select');
      
      fields.forEach(field => {
        const id = field.id.replace('field-', '');
        if (field.type === 'checkbox') {
          payload[id] = field.checked;
        } else {
          payload[id] = field.value;
        }
      });

      const url = editingId 
        ? `/api/admin/${currentSubTab}/${editingId}`
        : `/api/admin/${currentSubTab}`;
      const method = editingId ? 'PUT' : 'POST';

      try {
        const res = await adminFetch(url, {
          method,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          contentFormModal.classList.remove('open');
          fetchContentItems();
        } else {
          const data = await res.json();
          alert(data.error || "Save operation failed");
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // ==========================================
  // PANEL 4: SETTINGS LOADER
  // ==========================================
  const settingsInfoForm = document.getElementById('settings-info-form');
  const settingsApiForm = document.getElementById('settings-api-form');
  const settingsPasswordForm = document.getElementById('settings-password-form');

  async function loadSettingsPanel() {
    try {
      const res = await adminFetch('/api/admin/settings');
      const settings = await res.json();

      if (settingsInfoForm) {
        document.getElementById('set-email').value = settings.email || '';
        document.getElementById('set-phone').value = settings.phone || '';
        document.getElementById('set-whatsapp').value = settings.whatsapp || '';
        document.getElementById('set-tagline').value = settings.siteTagline || '';
        document.getElementById('set-description').value = settings.siteDescription || '';
      }

      if (settingsApiForm) {
        document.getElementById('set-gemini-key').value = settings.geminiApiKey || '';
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Bind settings update
  if (settingsInfoForm) {
    settingsInfoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('settings-info-msg');
      msg.textContent = '';

      const payload = {
        email: document.getElementById('set-email').value,
        phone: document.getElementById('set-phone').value,
        whatsapp: document.getElementById('set-whatsapp').value,
        siteTagline: document.getElementById('set-tagline').value,
        siteDescription: document.getElementById('set-description').value
      };

      try {
        const res = await adminFetch('/api/admin/settings', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          msg.style.color = 'var(--color-success)';
          msg.textContent = 'Contact settings updated successfully!';
        }
      } catch (err) {
        msg.style.color = 'var(--color-danger)';
        msg.textContent = err.message || 'Failed to update settings';
      }
    });
  }

  // Bind API Key Update
  if (settingsApiForm) {
    settingsApiForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('settings-api-msg');
      msg.textContent = '';

      const key = document.getElementById('set-gemini-key').value;

      try {
        const res = await adminFetch('/api/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({ geminiApiKey: key })
        });
        if (res.ok) {
          msg.style.color = 'var(--color-success)';
          msg.textContent = 'API integrations key updated successfully!';
        }
      } catch (err) {
        msg.style.color = 'var(--color-danger)';
        msg.textContent = err.message || 'Failed to save integrations key';
      }
    });
  }

  // Bind Password Change
  if (settingsPasswordForm) {
    settingsPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('settings-pass-msg');
      msg.textContent = '';

      const oldPassword = document.getElementById('set-old-pass').value;
      const newPassword = document.getElementById('set-new-pass').value;

      try {
        const res = await adminFetch('/api/admin/change-password', {
          method: 'PUT',
          body: JSON.stringify({ oldPassword, newPassword })
        });
        if (res.ok) {
          msg.style.color = 'var(--color-success)';
          msg.textContent = 'Admin credentials password changed successfully!';
          settingsPasswordForm.reset();
        } else {
          const data = await res.json();
          throw new Error(data.error || 'Password update failed');
        }
      } catch (err) {
        msg.style.color = 'var(--color-danger)';
        msg.textContent = err.message || 'Failed to change password';
      }
    });
  }

});
