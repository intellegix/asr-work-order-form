// Signature Pad Setup
let signaturePad;
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Photo storage
let attachedPhotos = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initSignaturePad();
  setDefaultDate();
});

// Set today's date as default
function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dateOrdered').value = today;
  document.getElementById('signatureDate').value = today;
}

// Signature Pad
function initSignaturePad() {
  const canvas = document.getElementById('signaturePad');
  const ctx = canvas.getContext('2d');

  // Set canvas size
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  // Drawing settings
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Mouse events
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  // Touch events
  canvas.addEventListener('touchstart', handleTouchStart);
  canvas.addEventListener('touchmove', handleTouchMove);
  canvas.addEventListener('touchend', stopDrawing);

  signaturePad = { canvas, ctx };
}

function startDrawing(e) {
  isDrawing = true;
  const rect = signaturePad.canvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
}

function draw(e) {
  if (!isDrawing) return;

  const rect = signaturePad.canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  signaturePad.ctx.beginPath();
  signaturePad.ctx.moveTo(lastX, lastY);
  signaturePad.ctx.lineTo(x, y);
  signaturePad.ctx.stroke();

  lastX = x;
  lastY = y;
}

function stopDrawing() {
  isDrawing = false;
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = signaturePad.canvas.getBoundingClientRect();
  isDrawing = true;
  lastX = touch.clientX - rect.left;
  lastY = touch.clientY - rect.top;
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!isDrawing) return;

  const touch = e.touches[0];
  const rect = signaturePad.canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  signaturePad.ctx.beginPath();
  signaturePad.ctx.moveTo(lastX, lastY);
  signaturePad.ctx.lineTo(x, y);
  signaturePad.ctx.stroke();

  lastX = x;
  lastY = y;
}

function clearSignature() {
  const canvas = signaturePad.canvas;
  signaturePad.ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        addPhotoToPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }
  event.target.value = ''; // Reset input
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

  navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  })
  .then(stream => {
    cameraStream = stream;
    video.srcObject = stream;
    modal.style.display = 'flex';
  })
  .catch(err => {
    alert('Unable to access camera: ' + err.message);
  });
}

function capturePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('photoCanvas');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  addPhotoToPreview(dataUrl);

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
}

// PDF Generation
function generatePDF() {
  const element = document.getElementById('work-order-form');

  // Hide buttons temporarily
  const photoControls = document.querySelector('.photo-controls');
  const clearSigBtn = document.querySelector('.btn-clear-sig');
  const removePhotoBtns = document.querySelectorAll('.remove-photo');

  photoControls.style.display = 'none';
  clearSigBtn.style.display = 'none';
  removePhotoBtns.forEach(btn => btn.style.display = 'none');

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
  const filename = `ASR_WorkOrder_${jobName.replace(/\s+/g, '_')}_${dateOrdered}.pdf`;

  const opt = {
    margin: [0.3, 0.3, 0.3, 0.3],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: {
      unit: 'in',
      format: 'letter',
      orientation: 'portrait'
    },
    pagebreak: { mode: 'avoid-all' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    // Restore styles
    inputs.forEach((input, index) => {
      input.style.border = originalStyles[index].border;
      input.style.background = originalStyles[index].background;
    });

    photoControls.style.display = 'flex';
    clearSigBtn.style.display = 'block';
    removePhotoBtns.forEach(btn => btn.style.display = 'flex');
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
window.addEventListener('resize', function() {
  if (signaturePad) {
    const canvas = signaturePad.canvas;
    const rect = canvas.getBoundingClientRect();

    // Save current signature
    const imageData = canvas.toDataURL();

    // Resize canvas
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Restore settings
    signaturePad.ctx.strokeStyle = '#000';
    signaturePad.ctx.lineWidth = 2;
    signaturePad.ctx.lineCap = 'round';
    signaturePad.ctx.lineJoin = 'round';

    // Restore signature
    const img = new Image();
    img.onload = function() {
      signaturePad.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageData;
  }
});
