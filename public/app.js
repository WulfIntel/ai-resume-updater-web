document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resumeForm');
  const statusEl = document.getElementById('status');
  const yearEl = document.getElementById('year');

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  function setStatus(message, type = 'info') {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `status-message status-${type}`;
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');

    const resumeFileInput = document.getElementById('resumeFile');
    const resumeTextInput = document.getElementById('resumeText');
    const notesInput = document.getElementById('notes');
    const jobDescriptionInput = document.getElementById('jobDescription');

    const hasFile = resumeFileInput && resumeFileInput.files && resumeFileInput.files.length > 0;
    const resumeText = (resumeTextInput && resumeTextInput.value || '').trim();
    const jobDescription = (jobDescriptionInput && jobDescriptionInput.value || '').trim();

    if (!hasFile && !resumeText) {
      setStatus('Please upload a resume file or paste your resume text.', 'error');
      return;
    }

    if (!jobDescription) {
      setStatus('Please paste the target job description.', 'error');
      return;
    }

    setStatus('Preparing payment…', 'info');

    const formData = new FormData();
    if (hasFile) {
      formData.append('resumeFile', resumeFileInput.files[0]);
    }
    if (resumeText) {
      formData.append('resumeText', resumeText);
    }
    if (notesInput && notesInput.value) {
      formData.append('notes', notesInput.value);
    }
    formData.append('jobDescription', jobDescription);

    try {
      // Step 1: upload-and-prepare
      const uploadRes = await fetch('/api/resume/upload-and-prepare', {
        method: 'POST',
        body: formData
      });

      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok) {
        const message = uploadJson && uploadJson.message ? uploadJson.message : 'Unable to prepare resume data.';
        setStatus(message, 'error');
        return;
      }

      const { clientSessionId } = uploadJson;
      if (!clientSessionId) {
        setStatus('Missing client session ID from server.', 'error');
        return;
      }

      // Persist clientSessionId for use on the success page
      localStorage.setItem('aiResume_clientSessionId', clientSessionId);

      // Step 2: create Stripe Checkout Session
      setStatus('Redirecting to secure payment…', 'info');

      const paymentRes = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientSessionId })
      });

      const paymentJson = await paymentRes.json();

      if (!paymentRes.ok) {
        const message = paymentJson && paymentJson.message ? paymentJson.message : 'Unable to start payment.';
        setStatus(message, 'error');
        return;
      }

      if (!paymentJson.url) {
        setStatus('Payment URL not returned by server.', 'error');
        return;
      }

      window.location.href = paymentJson.url;
    } catch (err) {
      console.error(err);
      setStatus('An unexpected error occurred. Please try again.', 'error');
    }
  });
});