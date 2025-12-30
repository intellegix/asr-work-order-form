// Signature Pad Setup - Enhanced for mobile finger signatures
let signaturePad;
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let points = [];
let hasSignature = false;

// Photo storage
let attachedPhotos = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initSignaturePad();
  setDefaultDate();
  addViewportMeta();
});

// Ensure proper viewport for mobile
function addViewportMeta() {
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }
  viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
}

// Set today's date as default
function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dateOrdered').value = today;
  document.getElementById('signatureDate').value = today;
}

// Enhanced Signature Pad for finger/stylus input
function initSignaturePad() {
  const canvas = document.getElementById('signaturePad');
  const ctx = canvas.getContext('2d');

  // Set canvas size with proper DPI scaling
  setupCanvas(canvas, ctx);

  // Drawing settings for smooth signatures
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Mouse events
  canvas.addEventListener('mousedown', handleStart);
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('mouseup', handleEnd);
  canvas.addEventListener('mouseout', handleEnd);

  // Touch events - with passive: false to prevent scrolling
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

  signaturePad = { canvas, ctx };

  // Show instruction hint
  showSignatureHint();
}

// Setup canvas with proper DPI scaling
function setupCanvas(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // Set display size
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // Set actual size in memory (scaled for retina)
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Scale context to ensure correct drawing
  ctx.scale(dpr, dpr);
}

// Show hint until user starts signing
function showSignatureHint() {
  const container = document.querySelector('.signature-pad-container');
  let hint = container.querySelector('.signature-instructions');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'signature-instructions';
    hint.textContent = 'Sign here with finger or mouse';
    container.appendChild(hint);
  }
}

function hideSignatureHint() {
  const hint = document.querySelector('.signature-instructions');
  if (hint) {
    hint.style.opacity = '0';
    setTimeout(() => hint.remove(), 300);
  }
}

// Get position from event (handles both mouse and touch)
function getPosition(e, canvas) {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;

  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

// Mouse event handlers
function handleStart(e) {
  e.preventDefault();
  isDrawing = true;
  hasSignature = true;
  hideSignatureHint();

  const pos = getPosition(e, signaturePad.canvas);
  lastX = pos.x;
  lastY = pos.y;
  points = [{ x: pos.x, y: pos.y }];

  signaturePad.ctx.beginPath();
  signaturePad.ctx.moveTo(pos.x, pos.y);
}

function handleMove(e) {
  if (!isDrawing) return;
  e.preventDefault();

  const pos = getPosition(e, signaturePad.canvas);
  points.push({ x: pos.x, y: pos.y });

  // Draw smooth line using quadratic bezier curves
  if (points.length >= 3) {
    const lastTwoPoints = points.slice(-3);
    const controlPoint = lastTwoPoints[1];
    const endPoint = {
      x: (lastTwoPoints[1].x + lastTwoPoints[2].x) / 2,
      y: (lastTwoPoints[1].y + lastTwoPoints[2].y) / 2
    };

    signaturePad.ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
    signaturePad.ctx.stroke();
    signaturePad.ctx.beginPath();
    signaturePad.ctx.moveTo(endPoint.x, endPoint.y);
  }

  lastX = pos.x;
  lastY = pos.y;
}

function handleEnd(e) {
  if (!isDrawing) return;
  isDrawing = false;

  // Draw final segment
  if (points.length > 0) {
    const lastPoint = points[points.length - 1];
    signaturePad.ctx.lineTo(lastPoint.x, lastPoint.y);
    signaturePad.ctx.stroke();
  }

  points = [];
}

// Touch event handlers
function handleTouchStart(e) {
  e.preventDefault();
  if (e.touches.length === 1) {
    isDrawing = true;
    hasSignature = true;
    hideSignatureHint();

    const pos = getPosition(e, signaturePad.canvas);
    lastX = pos.x;
    lastY = pos.y;
    points = [{ x: pos.x, y: pos.y }];

    signaturePad.ctx.beginPath();
    signaturePad.ctx.moveTo(pos.x, pos.y);
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!isDrawing || e.touches.length !== 1) return;

  const pos = getPosition(e, signaturePad.canvas);
  points.push({ x: pos.x, y: pos.y });

  // Get pressure if available (for stylus support)
  let pressure = e.touches[0].force || 0.5;
  let lineWidth = 1.5 + pressure * 3;
  signaturePad.ctx.lineWidth = lineWidth;

  // Draw smooth line using quadratic bezier curves
  if (points.length >= 3) {
    const lastTwoPoints = points.slice(-3);
    const controlPoint = lastTwoPoints[1];
    const endPoint = {
      x: (lastTwoPoints[1].x + lastTwoPoints[2].x) / 2,
      y: (lastTwoPoints[1].y + lastTwoPoints[2].y) / 2
    };

    signaturePad.ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
    signaturePad.ctx.stroke();
    signaturePad.ctx.beginPath();
    signaturePad.ctx.moveTo(endPoint.x, endPoint.y);
  }

  lastX = pos.x;
  lastY = pos.y;
}

function handleTouchEnd(e) {
  e.preventDefault();
  if (!isDrawing) return;
  isDrawing = false;

  // Draw final segment
  if (points.length > 0) {
    const lastPoint = points[points.length - 1];
    signaturePad.ctx.lineTo(lastPoint.x, lastPoint.y);
    signaturePad.ctx.stroke();
  }

  points = [];
  signaturePad.ctx.lineWidth = 2.5; // Reset line width
}

function clearSignature() {
  const canvas = signaturePad.canvas;
  const ctx = signaturePad.ctx;
  const dpr = window.devicePixelRatio || 1;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(dpr, dpr);

  // Reset drawing settings
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  hasSignature = false;
  showSignatureHint();
}

// Material and Cost Calculations
function calculateMaterialTotal(row) {
  const qty = parseFloat(document.querySelector(`[name="qty${row}"]`).value) || 0;
  const price = parseFloat(document.querySelector(`[name="price${row}"]`).value) || 0;
  const total = qty * price;
  document.querySelector(`[name="total${row}"]`).value = total > 0 ? '$' + total.toFixed(2) : '';

  calculateTotals();
}

function calculateTotals() {
  // Calculate total materials
  let totalMaterial = 0;
  for (let i = 1; i <= 6; i++) {
    const qty = parseFloat(document.querySelector(`[name="qty${i}"]`).value) || 0;
    const price = parseFloat(document.querySelector(`[name="price${i}"]`).value) || 0;
    totalMaterial += qty * price;
  }
  document.getElementById('totalMaterial').value = totalMaterial > 0 ? '$' + totalMaterial.toFixed(2) : '';

  // Get other costs
  const labor = parseFloat(document.getElementById('labor').value) || 0;
  const wcIns = parseFloat(document.getElementById('wcIns').value) || 0;
  const tearOffDump = parseFloat(document.getElementById('tearOffDump').value) || 0;
  const commission = parseFloat(document.getElementById('commission').value) || 0;
  const contractPrice = parseFloat(document.getElementById('contractPrice').value) || 0;
  const overhead = parseFloat(document.getElementById('overhead').value) || 0;

  // Calculate total cost
  const totalCost = totalMaterial + labor + wcIns + tearOffDump + commission;
  document.getElementById('totalCost').value = totalCost > 0 ? '$' + totalCost.toFixed(2) : '';

  // Calculate gross profit percentage
  if (contractPrice > 0 && totalCost > 0) {
    const grossProfit = ((contractPrice - totalCost) / contractPrice) * 100;
    document.getElementById('grossProfit').value = grossProfit.toFixed(1) + '%';

    // Calculate net profit
    const netProfit = contractPrice - totalCost - overhead;
    document.getElementById('netProfit').value = '$' + netProfit.toFixed(2);
  } else {
    document.getElementById('grossProfit').value = '';
    document.getElementById('netProfit').value = '';
  }
}

// Photo Handling
function handlePhotoUpload(event) {
  const files = event.target.files;
  for (let file of files) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        // Compress image before adding
        compressImage(e.target.result, 1200, 0.8, (compressedDataUrl) => {
          addPhotoToPreview(compressedDataUrl);
        });
      };
      reader.readAsDataURL(file);
    }
  }
  event.target.value = ''; // Reset input
}

// Compress image for better PDF performance
function compressImage(dataUrl, maxWidth, quality, callback) {
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.src = dataUrl;
}

function addPhotoToPreview(dataUrl) {
  attachedPhotos.push(dataUrl);
  renderPhotoPreview();
}

function renderPhotoPreview() {
  const preview = document.getElementById('photoPreview');
  preview.innerHTML = '';

  attachedPhotos.forEach((photo, index) => {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.innerHTML = `
      <img src="${photo}" alt="Attached photo ${index + 1}">
      <button type="button" class="remove-photo" onclick="removePhoto(${index})">×</button>
    `;
    preview.appendChild(photoItem);
  });
}

function removePhoto(index) {
  attachedPhotos.splice(index, 1);
  renderPhotoPreview();
}

// Camera Functions
let cameraStream = null;

function openCamera() {
  const modal = document.getElementById('cameraModal');
  const video = document.getElementById('cameraVideo');

  // Request camera with mobile-friendly constraints
  const constraints = {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 }
    },
    audio: false
  };

  navigator.mediaDevices.getUserMedia(constraints)
  .then(stream => {
    cameraStream = stream;
    video.srcObject = stream;
    modal.style.display = 'flex';
    // Prevent body scroll when camera is open
    document.body.style.overflow = 'hidden';
  })
  .catch(err => {
    // Try again without facingMode constraint
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      cameraStream = stream;
      video.srcObject = stream;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    })
    .catch(err2 => {
      alert('Unable to access camera. Please check permissions and try again.');
    });
  });
}

function capturePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('photoCanvas');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  // Compress the captured photo
  compressImage(canvas.toDataURL('image/jpeg', 0.9), 1200, 0.8, (compressedDataUrl) => {
    addPhotoToPreview(compressedDataUrl);
  });

  closeCamera();
}

function closeCamera() {
  const modal = document.getElementById('cameraModal');
  const video = document.getElementById('cameraVideo');

  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  video.srcObject = null;
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// PDF Generation
function generatePDF() {
  const element = document.getElementById('work-order-form');

  // Hide buttons and hints temporarily
  const photoControls = document.querySelector('.photo-controls');
  const clearSigBtn = document.querySelector('.btn-clear-sig');
  const removePhotoBtns = document.querySelectorAll('.remove-photo');
  const sigHint = document.querySelector('.signature-instructions');

  photoControls.style.display = 'none';
  clearSigBtn.style.display = 'none';
  removePhotoBtns.forEach(btn => btn.style.display = 'none');
  if (sigHint) sigHint.style.display = 'none';

  // Convert inputs to display values for PDF
  const inputs = element.querySelectorAll('input, textarea');
  const originalStyles = [];

  inputs.forEach((input, index) => {
    originalStyles[index] = {
      border: input.style.border,
      background: input.style.background
    };
    input.style.border = 'none';
    input.style.background = 'transparent';
  });

  // Generate filename from job info
  const jobName = document.getElementById('jobName').value || 'WorkOrder';
  const dateOrdered = document.getElementById('dateOrdered').value || new Date().toISOString().split('T')[0];
  const filename = `ASR_WorkOrder_${jobName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateOrdered}.pdf`;

  const opt = {
    margin: [0.25, 0.25, 0.25, 0.25],
    filename: filename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      scrollY: 0
    },
    jsPDF: {
      unit: 'in',
      format: 'letter',
      orientation: 'portrait'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  // Show loading indicator on button
  const downloadBtn = document.querySelector('.btn-primary');
  const originalText = downloadBtn.textContent;
  downloadBtn.textContent = 'Generating...';
  downloadBtn.disabled = true;

  html2pdf().set(opt).from(element).save().then(() => {
    // Restore styles
    inputs.forEach((input, index) => {
      input.style.border = originalStyles[index].border;
      input.style.background = originalStyles[index].background;
    });

    photoControls.style.display = 'flex';
    clearSigBtn.style.display = 'block';
    removePhotoBtns.forEach(btn => btn.style.display = 'flex');
    if (sigHint && !hasSignature) sigHint.style.display = 'block';

    downloadBtn.textContent = originalText;
    downloadBtn.disabled = false;
  }).catch(err => {
    console.error('PDF generation error:', err);
    alert('Error generating PDF. Please try again.');

    // Restore everything on error
    inputs.forEach((input, index) => {
      input.style.border = originalStyles[index].border;
      input.style.background = originalStyles[index].background;
    });
    photoControls.style.display = 'flex';
    clearSigBtn.style.display = 'block';
    removePhotoBtns.forEach(btn => btn.style.display = 'flex');
    downloadBtn.textContent = originalText;
    downloadBtn.disabled = false;
  });
}

// Clear Form
function clearForm() {
  if (confirm('Are you sure you want to clear all form data?')) {
    // Clear all inputs
    const inputs = document.querySelectorAll('input:not([type="file"]), textarea');
    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        input.checked = false;
      } else {
        input.value = '';
      }
    });

    // Clear signature
    clearSignature();

    // Clear photos
    attachedPhotos = [];
    renderPhotoPreview();

    // Reset default date
    setDefaultDate();
  }
}

// Handle window resize for signature pad
let resizeTimeout;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function() {
    if (signaturePad) {
      const canvas = signaturePad.canvas;
      const ctx = signaturePad.ctx;

      // Save current signature
      const imageData = canvas.toDataURL();

      // Resize canvas with proper DPI
      setupCanvas(canvas, ctx);

      // Restore settings
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Restore signature if exists
      if (hasSignature) {
        const img = new Image();
        img.onload = function() {
          const rect = canvas.getBoundingClientRect();
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
        };
        img.src = imageData;
      }
    }
  }, 250);
});

// Prevent pull-to-refresh on mobile when touching signature pad
document.addEventListener('touchmove', function(e) {
  if (e.target.closest('.signature-pad')) {
    e.preventDefault();
  }
}, { passive: false });
