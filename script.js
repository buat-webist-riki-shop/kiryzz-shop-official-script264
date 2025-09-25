
// Configuration
const CONFIG = {
    TELEGRAM_BOT_TOKEN: '8484956055:AAFbQT7NKJfanozG6UQ7qmpF4aO5XAhF9Wc',
    TELEGRAM_CHAT_ID: '8017971635',
    WHATSAPP_GROUP_URL: 'https://chat.whatsapp.com/G9Dd9DdVfOX18zCzK5KmAB',
    SELLER_INFO: {
        name: 'zakzz',
        store: 'AlwaysZakzz Script Store'
    }
};

// Global variables
let selectedPackageData = {};
let selectedPaymentMethod = '';
let uploadedProof = null;

// Loading Animation
window.addEventListener('load', function() {
    startLoadingAnimation();
});

function startLoadingAnimation() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    const progressBar = document.getElementById('loading-progress');
    const percentText = document.getElementById('loading-percent');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                mainContent.classList.remove('hidden');
            }, 500);
        }
        progressBar.style.width = progress + '%';
        percentText.textContent = Math.floor(progress) + '%';
    }, 200);
}

// Scroll to packages section
function scrollToPackages() {
    document.getElementById('packages').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Package selection
function selectPackage(packageName, price) {
    selectedPackageData = {
        name: packageName,
        price: price,
        priceFormatted: formatPrice(price)
    };
    
    document.getElementById('selectedPackage').textContent = packageName;
    document.getElementById('selectedPrice').textContent = selectedPackageData.priceFormatted;
    document.getElementById('transferAmount').textContent = selectedPackageData.priceFormatted;
    
    // Show modal
    document.getElementById('orderModal').style.display = 'block';
    
    // Reset form
    resetOrderForm();
}

// Payment method selection
function selectPayment(method, number = null) {
    selectedPaymentMethod = method;
    
    // Update button states
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show payment details
    document.getElementById('paymentDetails').classList.remove('hidden');
    
    // Hide all payment options first
    document.querySelectorAll('.payment-option').forEach(option => {
        option.classList.add('hidden');
    });
    
    // Show selected payment option
    if (method === 'dana') {
        document.getElementById('danaPayment').classList.remove('hidden');
        if (number) {
            document.getElementById('danaNumber').textContent = number;
        }
    } else if (method === 'qris') {
        document.getElementById('qrisPayment').classList.remove('hidden');
    }
    
    updateConfirmButton();
}

// Copy to clipboard functionality
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        // Show confirmation
        const originalText = element.textContent;
        element.textContent = 'Tersalin!';
        element.style.color = '#28a745';
        
        setTimeout(() => {
            element.textContent = originalText;
            element.style.color = '';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        alert('Nomor berhasil disalin: ' + text);
    });
}

// Handle proof upload
function handleProofUpload() {
    const fileInput = document.getElementById('proofUpload');
    const previewDiv = document.getElementById('proofPreview');
    
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        uploadedProof = file;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewDiv.innerHTML = `
                <img src="${e.target.result}" alt="Bukti Transfer" style="max-width: 200px; border-radius: 10px;">
                <p>✅ Bukti transfer berhasil diupload</p>
            `;
            previewDiv.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
    
    updateConfirmButton();
}

// Update confirm button state
function updateConfirmButton() {
    const confirmBtn = document.getElementById('confirmBtn');
    const whatsappBtn = document.getElementById('whatsappBtn');
    
    if (selectedPaymentMethod && uploadedProof) {
        confirmBtn.disabled = false;
        confirmBtn.style.background = '#28a745';
    } else {
        confirmBtn.disabled = true;
        confirmBtn.style.background = '#ccc';
    }
}

// Confirm order and send to Telegram
async function confirmOrder() {
    if (!selectedPaymentMethod || !uploadedProof) {
        alert('Harap pilih metode pembayaran dan upload bukti transfer!');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmBtn');
    const whatsappBtn = document.getElementById('whatsappBtn');
    
    // Show loading
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    confirmBtn.disabled = true;
    
    try {
        // Prepare order data
        const orderData = {
            package: selectedPackageData.name,
            price: selectedPackageData.priceFormatted,
            paymentMethod: selectedPaymentMethod.toUpperCase(),
            timestamp: new Date().toLocaleString('id-ID'),
            customerInfo: 'Pembeli via Website ' + CONFIG.SELLER_INFO.store
        };
        
        // Send to Telegram
        const success = await sendOrderToTelegram(orderData);
        
        if (success) {
            // Enable WhatsApp button
            whatsappBtn.disabled = false;
            whatsappBtn.style.background = '#25d366';
            
            // Update confirm button
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Terkirim!';
            confirmBtn.style.background = '#28a745';
            
            // Show success message
            alert('✅ Pesanan berhasil dikirim!\nSilakan join grup WhatsApp untuk mendapatkan script.');
            
            // Auto redirect to WhatsApp group after 3 seconds
            setTimeout(() => {
                joinWhatsAppGroup();
            }, 3000);
            
        } else {
            throw new Error('Gagal mengirim ke Telegram');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Terjadi kesalahan saat mengirim pesanan. Silakan coba lagi atau hubungi admin.');
        
        // Reset button
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> Konfirmasi Pesanan';
        confirmBtn.disabled = false;
        confirmBtn.style.background = '#28a745';
    }
}

// Send order to Telegram
async function sendOrderToTelegram(orderData) {
    try {
        const message = `
🔔 *PESANAN BARU - ${CONFIG.SELLER_INFO.store}*

📦 *Detail Pesanan:*
• Paket: ${orderData.package}
• Harga: Rp ${orderData.price}
• Metode Pembayaran: ${orderData.paymentMethod}
• Waktu: ${orderData.timestamp}
• Customer: ${orderData.customerInfo}

💰 Status: Menunggu Verifikasi Admin
🎯 Seller: ${CONFIG.SELLER_INFO.name}

*Bukti transfer telah diupload oleh customer.*
Silakan verifikasi pembayaran dan kirim script ke customer.

#PesananBaru #AlwaysZakzz #ScriptBot
        `;
        
        const telegramURL = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        const response = await fetch(telegramURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CONFIG.TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
        const result = await response.json();
        return result.ok;
        
    } catch (error) {
        console.error('Telegram send error:', error);
        return false;
    }
}

// Join WhatsApp group
function joinWhatsAppGroup() {
    const whatsappBtn = document.getElementById('whatsappBtn');
    
    // Update button
    whatsappBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Membuka WhatsApp...';
    
    // Open WhatsApp group
    window.open(CONFIG.WHATSAPP_GROUP_URL, '_blank');
    
    // Close modal after joining
    setTimeout(() => {
        closeModal();
        
        // Show final message
        alert(`🎉 Terima kasih telah bergabung!\n\n📱 Anda akan segera mendapatkan:\n• Script ${selectedPackageData.name}\n• Panduan instalasi\n• Support teknis\n\n💬 Admin akan memverifikasi pembayaran Anda dalam 5-10 menit.`);
        
    }, 2000);
}

// Close modal
function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
    resetOrderForm();
}

// Reset order form
function resetOrderForm() {
    selectedPaymentMethod = '';
    uploadedProof = null;
    
    // Reset buttons
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Hide payment details
    document.getElementById('paymentDetails').classList.add('hidden');
    document.getElementById('proofPreview').classList.add('hidden');
    
    // Reset upload input
    document.getElementById('proofUpload').value = '';
    
    // Reset action buttons
    const confirmBtn = document.getElementById('confirmBtn');
    const whatsappBtn = document.getElementById('whatsappBtn');
    
    confirmBtn.innerHTML = '<i class="fas fa-check"></i> Konfirmasi Pesanan';
    confirmBtn.disabled = true;
    confirmBtn.style.background = '#ccc';
    
    whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Join Grup WhatsApp';
    whatsappBtn.disabled = true;
    whatsappBtn.style.background = '#ccc';
}

// Utility functions
function formatPrice(price) {
    return parseInt(price).toLocaleString('id-ID');
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('orderModal');
    if (event.target === modal) {
        closeModal();
    }
});

// Add smooth scrolling for all internal links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Add loading effect for external links
document.addEventListener('DOMContentLoaded', function() {
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    
    externalLinks.forEach(link => {
        link.addEventListener('click', function() {
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            
            setTimeout(() => {
                this.innerHTML = originalText;
            }, 2000);
        });
    });
});

// Initialize tooltips and animations
document.addEventListener('DOMContentLoaded', function() {
    // Add animation classes to elements as they come into view
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe animated elements
    document.querySelectorAll('.package-card, .feature-card, .contact-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

console.log('🚀 AlwaysZakzz Script Store - Loaded Successfully!');
console.log('💼 Created by: kiryzzofficiall');
console.log('🔧 Features: Auto Payment, Telegram Integration, WhatsApp Auto-Join');
