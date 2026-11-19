/**
 * Amazon Agent Gatekeeper
 * Autonomous AI Agent Authorization & Governance System
 * Implementation of "The Wells Fargo Rule" & Autonomous Spending Guardrails
 * Student Enrolment ID: pgd202564257
 */

(function () {
  'use strict';

  // --- Initial Pre-loaded Data ---
  const INITIAL_AGENTS = [
    {
      id: 'agent-1',
      customer: 'Lipsa',
      agentName: 'ShopBot',
      status: 'ACTIVE',
      registeredAt: '2026-11-19 09:30:00',
      revokedAt: null
    },
    {
      id: 'agent-2',
      customer: 'Lipsa',
      agentName: 'OldAssistant',
      status: 'REVOKED',
      registeredAt: '2026-11-15 14:20:10',
      revokedAt: '2026-11-18 11:45:22'
    }
  ];

  // --- State ---
  let agents = [];
  let auditLogs = [];

  // --- DOM Elements ---
  const regForm = document.getElementById('agentRegisterForm');
  const regCustomerInput = document.getElementById('regCustomerName');
  const regAgentInput = document.getElementById('regAgentName');
  const regTimestampInput = document.getElementById('regTimestamp');
  const agentsTableBody = document.getElementById('agentsTableBody');
  const agentCountPill = document.getElementById('agentCountPill');
  const btnResetAgents = document.getElementById('btnResetAgents');

  const simulatorForm = document.getElementById('simulatorForm');
  const simCustomerInput = document.getElementById('simCustomer');
  const simAgentInput = document.getElementById('simAgent');
  const simActionSelect = document.getElementById('simAction');
  const simAmountInput = document.getElementById('simAmount');
  const amountNote = document.getElementById('amountNote');

  const resultPlaceholder = document.getElementById('resultPlaceholder');
  const resultCard = document.getElementById('resultCard');
  const resultBadge = document.getElementById('resultBadge');
  const resultRuleChip = document.getElementById('resultRuleChip');
  const resultReason = document.getElementById('resultReason');
  const resultTimestamp = document.getElementById('resultTimestamp');
  const summaryCustomer = document.getElementById('summaryCustomer');
  const summaryAgent = document.getElementById('summaryAgent');
  const summaryAction = document.getElementById('summaryAction');
  const summaryAmount = document.getElementById('summaryAmount');

  const auditTableBody = document.getElementById('auditTableBody');
  const auditCountPill = document.getElementById('auditCountPill');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const btnClearAudit = document.getElementById('btnClearAudit');

  const statTotalAgents = document.getElementById('statTotalAgents');
  const statActiveAgents = document.getElementById('statActiveAgents');
  const statRevokedAgents = document.getElementById('statRevokedAgents');
  const statTotalEvaluations = document.getElementById('statTotalEvaluations');
  const liveClock = document.getElementById('liveClock');
  const toastContainer = document.getElementById('toastContainer');

  const rulesToggleHeader = document.getElementById('rulesToggleHeader');
  const rulesChipsGrid = document.getElementById('rulesChipsGrid');
  const rulesToggleIcon = document.getElementById('rulesToggleIcon');

  // --- Helper Functions ---

  function getFormattedTimestamp(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }

  function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⛔';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Clock updater ---
  function updateLiveClock() {
    if (liveClock) {
      liveClock.textContent = getFormattedTimestamp();
    }
  }

  // --- Persistence & State Loader ---
  function loadState() {
    try {
      const savedAgents = localStorage.getItem('amz_gatekeeper_agents');
      if (savedAgents) {
        agents = JSON.parse(savedAgents);
      } else {
        agents = JSON.parse(JSON.stringify(INITIAL_AGENTS));
      }

      const savedAudit = localStorage.getItem('amz_gatekeeper_audit');
      if (savedAudit) {
        auditLogs = JSON.parse(savedAudit);
      } else {
        auditLogs = [];
      }
    } catch (e) {
      console.warn('LocalStorage error, using defaults:', e);
      agents = JSON.parse(JSON.stringify(INITIAL_AGENTS));
      auditLogs = [];
    }
  }

  function saveState() {
    try {
      localStorage.setItem('amz_gatekeeper_agents', JSON.stringify(agents));
      localStorage.setItem('amz_gatekeeper_audit', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  // --- KPI Stats Updater ---
  function updateKPIs() {
    const total = agents.length;
    const active = agents.filter(a => a.status === 'ACTIVE').length;
    const revoked = agents.filter(a => a.status === 'REVOKED').length;
    const evals = auditLogs.length;

    statTotalAgents.textContent = total;
    statActiveAgents.textContent = active;
    statRevokedAgents.textContent = revoked;
    statTotalEvaluations.textContent = evals;

    agentCountPill.textContent = `${total} Agent${total === 1 ? '' : 's'}`;
    auditCountPill.textContent = `${evals} Record${evals === 1 ? '' : 's'}`;
  }

  // --- Render Agents Table ---
  function renderAgentsTable() {
    agentsTableBody.innerHTML = '';

    if (agents.length === 0) {
      agentsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            No agents registered. Register an AI agent above.
          </td>
        </tr>`;
      updateKPIs();
      return;
    }

    agents.forEach((agent) => {
      const tr = document.createElement('tr');
      const isActive = agent.status === 'ACTIVE';

      tr.innerHTML = `
        <td><strong>${escapeHtml(agent.customer)}</strong></td>
        <td><span class="table-mono">${escapeHtml(agent.agentName)}</span></td>
        <td>
          <span class="status-badge ${isActive ? 'status-active' : 'status-revoked'}">
            ${isActive ? '● ACTIVE' : '✕ REVOKED'}
          </span>
        </td>
        <td><span class="table-mono">${escapeHtml(agent.registeredAt || '—')}</span></td>
        <td><span class="table-mono">${agent.revokedAt ? escapeHtml(agent.revokedAt) : '—'}</span></td>
        <td class="text-right">
          ${
            isActive
              ? `<button type="button" class="btn btn-revoke" data-agent-id="${agent.id}" title="Immediately revoke access under Wells Fargo rule">
                   Revoke Access
                 </button>`
              : `<span class="text-muted" style="font-size: 11.5px;">Revoked</span>`
          }
        </td>
      `;

      agentsTableBody.appendChild(tr);
    });

    updateKPIs();
  }

  // --- Revoke Agent Access (The Wells Fargo Rule) ---
  function revokeAgentAccess(agentId) {
    const target = agents.find(a => a.id === agentId);
    if (!target) return;

    const currentTs = getFormattedTimestamp();
    target.status = 'REVOKED';
    target.revokedAt = currentTs;

    saveState();
    renderAgentsTable();
    showToast(`Access REVOKED for agent "${target.agentName}" (${target.customer}) at ${currentTs}.`, 'error');
  }

  // --- Register New Agent ---
  function handleRegisterAgent(e) {
    e.preventDefault();

    const customer = regCustomerInput.value.trim();
    const agentName = regAgentInput.value.trim();
    const timestamp = regTimestampInput.value.trim() || getFormattedTimestamp();

    if (!customer || !agentName) {
      showToast('Please provide both Customer Name and Agent Name.', 'error');
      return;
    }

    // Check for existing registration for that customer and agent (case-insensitive)
    const existingIndex = agents.findIndex(
      a => a.customer.toLowerCase() === customer.toLowerCase() &&
           a.agentName.toLowerCase() === agentName.toLowerCase()
    );

    if (existingIndex !== -1) {
      const existing = agents[existingIndex];
      if (existing.status === 'ACTIVE') {
        showToast(`Agent "${agentName}" is already ACTIVE for customer "${customer}".`, 'error');
        return;
      } else {
        // Reactivating a previously revoked agent with a new registration timestamp
        existing.status = 'ACTIVE';
        existing.registeredAt = timestamp;
        existing.revokedAt = null;
        showToast(`Re-registered & activated agent "${agentName}" for customer "${customer}".`, 'success');
      }
    } else {
      const newAgent = {
        id: 'agent-' + Date.now(),
        customer,
        agentName,
        status: 'ACTIVE',
        registeredAt: timestamp,
        revokedAt: null
      };
      agents.unshift(newAgent);
      showToast(`Agent "${agentName}" successfully registered for "${customer}".`, 'success');
    }

    saveState();
    renderAgentsTable();

    // Reset inputs & update timestamp
    regCustomerInput.value = '';
    regAgentInput.value = '';
    regTimestampInput.value = getFormattedTimestamp();
  }

  // --- Policy Evaluation Engine (Rules 1 to 7 in exact order) ---
  function evaluateGatekeeperRules(customer, agentName, action, amount) {
    const normCustomer = (customer || '').trim().toLowerCase();
    const normAgent = (agentName || '').trim().toLowerCase();
    const parsedAmount = Number(amount) || 0;

    // Find agent registered for that specific customer
    const matchedAgent = agents.find(
      a => a.customer.trim().toLowerCase() === normCustomer &&
           a.agentName.trim().toLowerCase() === normAgent
    );

    // Rule 1: If agent is registered for that customer but status is REVOKED -> BLOCK
    if (matchedAgent && matchedAgent.status === 'REVOKED') {
      const revokedTimestamp = matchedAgent.revokedAt || 'previous date';
      return {
        decision: 'BLOCK',
        ruleNumber: 'Rule 1',
        reason: `Rule 1: Agent access was revoked on ${revokedTimestamp}.`
      };
    }

    // Rule 2: If agent is not registered for that customer -> BLOCK
    if (!matchedAgent) {
      return {
        decision: 'BLOCK',
        ruleNumber: 'Rule 2',
        reason: 'Rule 2: Unknown/unregistered AI agent.'
      };
    }

    // (Agent is confirmed registered and status is ACTIVE)

    // Rule 3: If action is "view order" -> ALLOW
    if (action === 'view order') {
      return {
        decision: 'ALLOW',
        ruleNumber: 'Rule 3',
        reason: 'Rule 3: Read-only action allowed for active registered agent.'
      };
    }

    // Rule 4: If action is "place order" and amount > 5000 -> ASK CUSTOMER
    if (action === 'place order' && parsedAmount > 5000) {
      return {
        decision: 'ASK CUSTOMER',
        ruleNumber: 'Rule 4',
        reason: 'Rule 4: Order exceeds ₹5,000 autonomous spending limit; customer confirmation required.'
      };
    }

    // Rule 5: If action is "place order" and amount <= 5000 -> ALLOW
    if (action === 'place order' && parsedAmount <= 5000) {
      return {
        decision: 'ALLOW',
        ruleNumber: 'Rule 5',
        reason: 'Rule 5: Order is within ₹5,000 autonomous spending limit.'
      };
    }

    // Rule 6: If action is "return" -> ALLOW
    if (action === 'return') {
      return {
        decision: 'ALLOW',
        ruleNumber: 'Rule 6',
        reason: 'Rule 6: Return request allowed for active registered agent.'
      };
    }

    // Rule 7: If action is "refund" -> ASK CUSTOMER
    if (action === 'refund') {
      return {
        decision: 'ASK CUSTOMER',
        ruleNumber: 'Rule 7',
        reason: 'Rule 7: Refund requests always require customer confirmation.'
      };
    }

    // Fallback safeguard (should not happen with specified actions)
    return {
      decision: 'ASK CUSTOMER',
      ruleNumber: 'Rule 7',
      reason: 'Rule 7: Unrecognized autonomous action requires customer confirmation.'
    };
  }

  // --- Display Result in UI ---
  function displayEvaluationResult(result, customer, agentName, action, amount, timestamp) {
    resultPlaceholder.classList.add('hidden');
    resultCard.classList.remove('hidden');

    // Update Decision Badge styling
    resultBadge.className = 'decision-badge';
    if (result.decision === 'ALLOW') {
      resultBadge.classList.add('badge-allow');
      resultBadge.innerHTML = '✔ ALLOW';
    } else if (result.decision === 'ASK CUSTOMER') {
      resultBadge.classList.add('badge-ask');
      resultBadge.innerHTML = '⚠️ ASK CUSTOMER';
    } else {
      resultBadge.classList.add('badge-block');
      resultBadge.innerHTML = '⛔ BLOCK';
    }

    resultRuleChip.textContent = result.ruleNumber;
    resultReason.textContent = result.reason;
    resultTimestamp.textContent = timestamp;

    summaryCustomer.textContent = customer;
    summaryAgent.textContent = agentName;
    summaryAction.textContent = action;
    summaryAmount.textContent = (action === 'place order' || action === 'refund') ? formatCurrency(amount) : 'N/A';

    // Smooth scroll if needed for visibility
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // --- Add Entry to Audit Log Table ---
  function addAuditLogEntry(entry, isNew = true) {
    // Remove empty placeholder row if present
    const emptyRow = document.getElementById('emptyAuditRow');
    if (emptyRow) {
      emptyRow.remove();
    }

    const tr = document.createElement('tr');
    if (isNew) {
      tr.classList.add('new-row-flash');
    }

    let badgeClass = 'decision-allow';
    let badgeText = 'ALLOW';
    if (entry.decision === 'ASK CUSTOMER') {
      badgeClass = 'decision-ask';
      badgeText = 'ASK CUSTOMER';
    } else if (entry.decision === 'BLOCK') {
      badgeClass = 'decision-block';
      badgeText = 'BLOCK';
    }

    tr.innerHTML = `
      <td><span class="table-mono">${escapeHtml(entry.timestamp)}</span></td>
      <td><strong>${escapeHtml(entry.customer)}</strong></td>
      <td><span class="table-mono">${escapeHtml(entry.agentName)}</span></td>
      <td><span class="table-mono">${escapeHtml(entry.action)}</span></td>
      <td><strong>${escapeHtml(entry.formattedAmount)}</strong></td>
      <td>
        <span class="decision-cell-badge ${badgeClass}">${badgeText}</span>
      </td>
      <td><span style="font-size: 12.5px;">${escapeHtml(entry.ruleTriggered)}</span></td>
    `;

    // Prepend to top of table
    auditTableBody.insertBefore(tr, auditTableBody.firstChild);
    updateKPIs();
  }

  function renderFullAuditTable() {
    auditTableBody.innerHTML = '';
    if (auditLogs.length === 0) {
      auditTableBody.innerHTML = `
        <tr class="empty-row" id="emptyAuditRow">
          <td colspan="7" class="text-center py-4 text-muted">
            No requests evaluated yet. Run a simulation above to generate audit logs.
          </td>
        </tr>`;
      updateKPIs();
      return;
    }

    auditLogs.forEach((entry) => {
      addAuditLogEntry(entry, false);
    });
  }

  // --- Handle Request Evaluation Submit ---
  function handleEvaluateRequest(e) {
    if (e && e.preventDefault) e.preventDefault();

    const customer = simCustomerInput.value.trim();
    const agentName = simAgentInput.value.trim();
    const action = simActionSelect.value;
    const amountVal = simAmountInput.value;
    const amount = Number(amountVal) || 0;

    if (!customer || !agentName) {
      showToast('Please specify both Customer Name and Agent Name for simulation.', 'error');
      return;
    }

    const timestamp = getFormattedTimestamp();
    const evaluation = evaluateGatekeeperRules(customer, agentName, action, amount);

    // Display decision card
    displayEvaluationResult(evaluation, customer, agentName, action, amount, timestamp);

    // Create audit record
    const auditRecord = {
      id: 'audit-' + Date.now(),
      timestamp,
      customer,
      agentName,
      action,
      amount: (action === 'place order' || action === 'refund') ? amount : 0,
      formattedAmount: (action === 'place order' || action === 'refund') ? formatCurrency(amount) : '₹0',
      decision: evaluation.decision,
      ruleTriggered: evaluation.reason
    };

    auditLogs.unshift(auditRecord);
    saveState();
    addAuditLogEntry(auditRecord, true);

    if (evaluation.decision === 'ALLOW') {
      showToast(`Request ALLOWED (${evaluation.ruleNumber})`, 'success');
    } else if (evaluation.decision === 'ASK CUSTOMER') {
      showToast(`Request flagged: ASK CUSTOMER (${evaluation.ruleNumber})`, 'info');
    } else {
      showToast(`Request BLOCKED: ${evaluation.reason}`, 'error');
    }
  }

  // --- 1-Click Demo Scenarios (Presets) ---
  const PRESET_SCENARIOS = {
    'revoked': {
      customer: 'Lipsa',
      agentName: 'OldAssistant',
      action: 'place order',
      amount: 1200,
      desc: 'Rule 1: Testing Revoked Agent'
    },
    'unknown': {
      customer: 'Lipsa',
      agentName: 'RogueAgent_99',
      action: 'view order',
      amount: 0,
      desc: 'Rule 2: Testing Unregistered Agent'
    },
    'view': {
      customer: 'Lipsa',
      agentName: 'ShopBot',
      action: 'view order',
      amount: 0,
      desc: 'Rule 3: Testing View Order (Read-only)'
    },
    'high-order': {
      customer: 'Lipsa',
      agentName: 'ShopBot',
      action: 'place order',
      amount: 14999,
      desc: 'Rule 4: Testing High Value Order (> ₹5,000)'
    },
    'low-order': {
      customer: 'Lipsa',
      agentName: 'ShopBot',
      action: 'place order',
      amount: 2499,
      desc: 'Rule 5: Testing Autonomous Order (≤ ₹5,000)'
    },
    'return': {
      customer: 'Lipsa',
      agentName: 'ShopBot',
      action: 'return',
      amount: 0,
      desc: 'Rule 6: Testing Return Action'
    },
    'refund': {
      customer: 'Lipsa',
      agentName: 'ShopBot',
      action: 'refund',
      amount: 2499,
      desc: 'Rule 7: Testing Refund Action'
    }
  };

  function applyPreset(presetKey) {
    const preset = PRESET_SCENARIOS[presetKey];
    if (!preset) return;

    simCustomerInput.value = preset.customer;
    simAgentInput.value = preset.agentName;
    simActionSelect.value = preset.action;
    simAmountInput.value = preset.amount;

    handleActionChange();

    // Trigger immediate evaluation for seamless demo recording
    handleEvaluateRequest();
  }

  // --- Dynamic Amount Input Helper ---
  function handleActionChange() {
    const action = simActionSelect.value;
    if (action === 'view order' || action === 'return') {
      simAmountInput.value = 0;
      simAmountInput.disabled = true;
      amountNote.textContent = '(Not applicable for this action)';
    } else if (action === 'refund') {
      simAmountInput.disabled = false;
      amountNote.textContent = '(Refund always flags Rule 7)';
    } else {
      simAmountInput.disabled = false;
      amountNote.textContent = '(Autonomous cap: ₹5,000)';
    }
  }

  // --- Export Audit Log as CSV ---
  function exportAuditLogToCSV() {
    if (auditLogs.length === 0) {
      showToast('Audit Log is currently empty. Run a simulation first.', 'error');
      return;
    }

    const headers = [
      'Date & Time',
      'Customer',
      'Agent Name',
      'Action',
      'Amount (INR)',
      'Decision',
      'Rule Triggered',
      'Student Enrolment ID'
    ];

    const escapeCsvField = (text) => {
      if (text === null || text === undefined) return '""';
      const str = String(text).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.map(escapeCsvField).join(',')];

    auditLogs.forEach((log) => {
      const row = [
        escapeCsvField(log.timestamp),
        escapeCsvField(log.customer),
        escapeCsvField(log.agentName),
        escapeCsvField(log.action),
        escapeCsvField(log.amount),
        escapeCsvField(log.decision),
        escapeCsvField(log.ruleTriggered),
        escapeCsvField('pgd202564257')
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\r\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    const dateStamp = getFormattedTimestamp().replace(/[: ]/g, '-');
    downloadAnchor.setAttribute('download', `amazon_gatekeeper_audit_log_${dateStamp}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast(`Exported ${auditLogs.length} audit records to CSV successfully!`, 'success');
  }

  // --- Reset Agents to Default Sample State ---
  function resetDemoAgents() {
    if (confirm('Reset agents to default demo samples (ShopBot: ACTIVE, OldAssistant: REVOKED)?')) {
      agents = JSON.parse(JSON.stringify(INITIAL_AGENTS));
      saveState();
      renderAgentsTable();
      showToast('Demo agents reset to original state.', 'info');
    }
  }

  // --- Clear Audit Log ---
  function clearAuditLog() {
    if (auditLogs.length === 0) return;
    if (confirm('Clear all recorded audit logs?')) {
      auditLogs = [];
      saveState();
      renderFullAuditTable();
      showToast('Audit log cleared.', 'info');
    }
  }

  // --- XSS Escaper ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Attach Event Listeners ---
  function setupEventListeners() {
    // Form registration
    regForm.addEventListener('submit', handleRegisterAgent);

    // Agent Revocation click delegation
    agentsTableBody.addEventListener('click', (e) => {
      const targetBtn = e.target.closest('.btn-revoke');
      if (targetBtn) {
        const agentId = targetBtn.getAttribute('data-agent-id');
        revokeAgentAccess(agentId);
      }
    });

    // Reset agents
    btnResetAgents.addEventListener('click', resetDemoAgents);

    // Simulator form submit
    simulatorForm.addEventListener('submit', handleEvaluateRequest);

    // Action select change
    simActionSelect.addEventListener('change', handleActionChange);

    // 1-Click Preset Scenario Buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const presetKey = btn.getAttribute('data-preset');
        applyPreset(presetKey);
      });
    });

    // CSV Export
    btnExportCsv.addEventListener('click', exportAuditLogToCSV);

    // Clear Audit
    btnClearAudit.addEventListener('click', clearAuditLog);

    // Toggle Policy Cheat Sheet
    if (rulesToggleHeader && rulesChipsGrid) {
      rulesToggleHeader.addEventListener('click', () => {
        const isHidden = rulesChipsGrid.classList.toggle('hidden');
        rulesToggleIcon.textContent = isHidden ? '▸' : '▾';
      });
    }

    // Auto-update registration timestamp field periodically
    regTimestampInput.value = getFormattedTimestamp();
    setInterval(() => {
      updateLiveClock();
      if (!regTimestampInput.value || document.activeElement !== regTimestampInput) {
        regTimestampInput.value = getFormattedTimestamp();
      }
    }, 1000);
  }

  // --- Initialization ---
  function init() {
    loadState();
    renderAgentsTable();
    renderFullAuditTable();
    updateLiveClock();
    handleActionChange();
    setupEventListeners();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
