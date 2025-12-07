(function () {
  const enhancedResumeEl = document.getElementById('enhancedResume');
  const creditsBadgeEl = document.getElementById('creditsBadge');
  const initialStatusEl = document.getElementById('initialStatus');
  const revisionForm = document.getElementById('revisionForm');
  const revisionStatusEl = document.getElementById('revisionStatus');
  const revisionSubmitBtn = document.getElementById('revisionSubmitBtn');
  const noCreditsContainer = document.getElementById('noCreditsContainer');
  const noCreditsMessageEl = document.getElementById('noCreditsMessage');
  const yearEl = document.getElementById('year');

  const copyBtn = document.getElementById('copyBtn');
  const downloadTxtBtn = document.getElementById('downloadTxtBtn');
  const downloadMdBtn = document.getElementById('downloadMdBtn');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  function setInitialStatus(message, type = 'info') {
    if (!initialStatusEl) return;
    initialStatusEl.textContent = message;
    initialStatusEl.className = `status-message status-${type}`;
  }

  function setRevisionStatus(message, type = 'info') {
    if (!revisionStatusEl) return;
    revisionStatusEl.textContent = message;
    revisionStatusEl.className = `status-message status-${type}`;
  }

  function setCreditsBadge(remaining) {
    if (!creditsBadgeEl) return;
    const total = 3;
    creditsBadgeEl.textContent = `Credits left: ${remaining} / ${total}`;
  }

  function disableRevisionForm() {
    if (!revisionForm) return;
    const elements = revisionForm.elements;
    for (let i = 0; i < elements.length; i++) {
      elements[i].disabled = true;
    }
  }

  function showNoCredits(message) {
    if (noCreditsContainer) {
      noCreditsContainer.hidden = false;
    }
    if (noCreditsMessageEl) {
      noCreditsMessageEl.textContent = message;
    }
    disableRevisionForm();
  }

  function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  async function generateInitialResume() {
    const checkoutSessionId = getQueryParam('session_id');
    const clientSessionId = localStorage.getItem('aiResume_clientSessionId');

    if (!checkoutSessionId || !clientSessionId) {
      setInitialStatus(
        'Missing session information. Please return to the home page and start again.',
        'error'
      );
      if (creditsBadgeEl) {
        creditsBadgeEl.textContent = 'Credits: unavailable';
      }
      return;
    }

    setInitialStatus('Generating your first upgraded resume…', 'info');

    try {
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutSessionId, clientSessionId })
      });

      const json = await res.json();

      if (!res.ok) {
        if (json && json.error === 'NO_CREDITS') {
          setInitialStatus(json.message || 'No credits remaining for this purchase.', 'error');
          setCreditsBadge(0);
          showNoCredits(json.message || 'You have used all 3 resume upgrades for this purchase.');
          return;
        }

        const message =
          json && json.message
            ? json.message
            : 'Unable to generate your enhanced resume. Please try again.';
        setInitialStatus(message, 'error');
        setCreditsBadge(0);
        return;
      }

      const { enhancedResumeText, remainingCredits } = json;
      if (enhancedResumeEl) {
        enhancedResumeEl.textContent = enhancedResumeText || '';
      }
      setCreditsBadge(typeof remainingCredits === 'number' ? remainingCredits : 0);
      setInitialStatus('Your upgraded resume is ready.', 'success');
    } catch (err) {
      console.error(err);
      setInitialStatus('An unexpected error occurred while generating your resume.', 'error');
      if (creditsBadgeEl) {
        creditsBadgeEl.textContent = 'Credits: unavailable';
      }
    }
  }

  function attachDownloadAndCopyHandlers() {
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (!enhancedResumeEl || !enhancedResumeEl.textContent) return;
        try {
          await navigator.clipboard.writeText(enhancedResumeEl.textContent);
          setInitialStatus('Copied enhanced resume to clipboard.', 'success');
        } catch (err) {
          console.error(err);
          setInitialStatus('Unable to copy to clipboard. Please copy manually.', 'error');
        }
      });
    }

    function downloadFile(extension, mimeType) {
      if (!enhancedResumeEl || !enhancedResumeEl.textContent) return;
      const text = enhancedResumeEl.textContent;
      const blob = new Blob([text], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enhanced-resume.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    if (downloadTxtBtn) {
      downloadTxtBtn.addEventListener('click', () => {
        downloadFile('txt', 'text/plain');
      });
    }

    if (downloadMdBtn) {
      downloadMdBtn.addEventListener('click', () => {
        downloadFile('md', 'text/markdown');
      });
    }
  }

  function attachRevisionHandler() {
    if (!revisionForm) return;

    revisionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setRevisionStatus('');

      const checkoutSessionId = getQueryParam('session_id');
      if (!checkoutSessionId) {
        setRevisionStatus('Missing payment session. Please start a new purchase.', 'error');
        return;
      }

      const fileInput = document.getElementById('revResumeFile');
      const textInput = document.getElementById('revResumeText');
      const notesInput = document.getElementById('revNotes');
      const jdInput = document.getElementById('revJobDescription');

      const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;
      const resumeText = (textInput && textInput.value || '').trim();
      const jobDescription = (jdInput && jdInput.value || '').trim();

      if (!hasFile && !resumeText) {
        setRevisionStatus('Please upload a resume file or paste your resume text.', 'error');
        return;
      }

      if (!jobDescription) {
        setRevisionStatus('Please paste the target job description.', 'error');
        return;
      }

      setRevisionStatus('Preparing your new version…', 'info');
      if (revisionSubmitBtn) revisionSubmitBtn.disabled = true;

      const formData = new FormData();
      if (hasFile) {
        formData.append('resumeFile', fileInput.files[0]);
      }
      if (resumeText) {
        formData.append('resumeText', resumeText);
      }
      if (notesInput && notesInput.value) {
        formData.append('notes', notesInput.value);
      }
      formData.append('jobDescription', jobDescription);

      try {
        // Step 1: upload new resume data
        const uploadRes = await fetch('/api/resume/upload-and-prepare', {
          method: 'POST',
          body: formData
        });

        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) {
          const message =
            uploadJson && uploadJson.message
              ? uploadJson.message
              : 'Unable to prepare resume data.';
          setRevisionStatus(message, 'error');
          if (revisionSubmitBtn) revisionSubmitBtn.disabled = false;
          return;
        }

        const { clientSessionId } = uploadJson;
        if (!clientSessionId) {
          setRevisionStatus('Missing client session ID from server.', 'error');
          if (revisionSubmitBtn) revisionSubmitBtn.disabled = false;
          return;
        }

        // Step 2: generate enhanced resume using remaining credit
        const genRes = await fetch('/api/resume/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutSessionId, clientSessionId })
        });

        const genJson = await genRes.json();

        if (!genRes.ok) {
          if (genJson && genJson.error === 'NO_CREDITS') {
            setRevisionStatus(genJson.message || 'You have used all credits.', 'error');
            setCreditsBadge(0);
            showNoCredits(
              genJson.message || 'You have used all 3 resume upgrades for this purchase.'
            );
            return;
          }

          const message =
            genJson && genJson.message
              ? genJson.message
              : 'Unable to generate another version. Please try again.';
          setRevisionStatus(message, 'error');
          if (revisionSubmitBtn) revisionSubmitBtn.disabled = false;
          return;
        }

        const { enhancedResumeText, remainingCredits } = genJson;
        if (enhancedResumeEl) {
          enhancedResumeEl.textContent = enhancedResumeText || '';
        }
        setCreditsBadge(typeof remainingCredits === 'number' ? remainingCredits : 0);
        setRevisionStatus('New version generated from your remaining credits.', 'success');
      } catch (err) {
        console.error(err);
        setRevisionStatus('An unexpected error occurred. Please try again.', 'error');
      } finally {
        if (revisionSubmitBtn) revisionSubmitBtn.disabled = false;
      }
    });
  }

  // Initialize page
  generateInitialResume();
  attachDownloadAndCopyHandlers();
  attachRevisionHandler();
})();