document.addEventListener('DOMContentLoaded', () => {

    // Form input elements
    const inputs = {
        name: document.getElementById('name'),
        designation: document.getElementById('designation'),
        phone: document.getElementById('phone'),
        email: document.getElementById('email'),
        location: document.getElementById('location')
    };

    // Preview elements on the card
    const preview = {
        name: document.getElementById('preview-name'),
        designation: document.getElementById('preview-designation'),
        phone: document.getElementById('preview-phone'),
        email: document.getElementById('preview-email'),
        location: document.getElementById('preview-location')
    };

    const jsonOutput = document.getElementById('json-output');
    const qrContainer = document.getElementById('qr-code');

    // Initialize QR code instance
    let qrCode = new QRCode(qrContainer, {
        text: ' ',
        width: 180,
        height: 180,
        colorDark: '#0d7068',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });

    /**
     * Escapes HTML special characters and converts newlines to <br> tags
     */
    function formatMultiline(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
    }

    /**
     * Generates a vCard string from the current form data
     */
    function generateVCard(data) {
        // Clean phone number (remove spaces and dashes for tel: format)
        const cleanPhone = data.phone.replace(/[\s\-]/g, '');

        // Split name for vCard N field (last;first)
        const nameParts = data.name.split(' ');
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const firstName = nameParts.slice(0, -1).join(' ') || data.name;

        return [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${data.name}`,
            `N:${lastName};${firstName};;;`,
            `TITLE:${data.designation}`,
            `ORG:Navachetana Livelihoods Private Limited`,
            `TEL;TYPE=CELL:${cleanPhone}`,
            `EMAIL:${data.email}`,
            `URL:https://navachetanalivelihoods.com`,
            `ADR;TYPE=WORK:;;${data.location.replace(/\n/g, ', ')};;;;`,
            'END:VCARD'
        ].join('\n');
    }

    // Debounce timer for QR code updates
    let qrTimer = null;

    /**
     * Core update function: reads form → builds JSON → updates card preview + QR
     */
    function updateCard() {
        // 1. Gather all values into a JSON-ready object
        const cardData = {
            name: inputs.name.value.trim(),
            designation: inputs.designation.value.trim(),
            phone: inputs.phone.value.trim(),
            email: inputs.email.value.trim(),
            location: inputs.location.value.trim(),
            company: 'Navachetana Livelihoods Private Limited',
            website: 'https://navachetanalivelihoods.com'
        };

        // 2. Output the JSON to the code block
        jsonOutput.textContent = JSON.stringify(cardData, null, 2);

        // 3. Update the live card preview
        preview.name.textContent = cardData.name || 'Your Name';
        preview.designation.textContent = cardData.designation || 'Designation';
        preview.phone.textContent = cardData.phone || '+00 - 0000000000';
        preview.email.textContent = cardData.email || 'email@example.com';
        preview.location.innerHTML = formatMultiline(cardData.location) || 'Office Address';

        // 4. Regenerate QR code (debounced so it doesn't flash on every keystroke)
        clearTimeout(qrTimer);
        qrTimer = setTimeout(() => {
            const vCardString = generateVCard(cardData);
            qrCode.clear();
            qrCode.makeCode(vCardString);
        }, 300);
    }

    // Attach live event listeners on every form input
    Object.values(inputs).forEach(el => {
        el.addEventListener('input', updateCard);
        el.addEventListener('change', updateCard);
    });

    // Initial render
    updateCard();

    // Share button functionality
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            // Get current card data
            const cardData = {
                name: inputs.name.value.trim(),
                designation: inputs.designation.value.trim(),
                phone: inputs.phone.value.trim(),
                email: inputs.email.value.trim(),
                location: inputs.location.value.trim()
            };

            // Create shareable URL with encoded data
            const shareData = btoa(JSON.stringify(cardData));
            const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(shareData)}`;

            // Generate vCard data for both QR code and contact saving
            const vCardData = generateVCard(cardData);

            // Try Web Share API first (works on iOS 12.2+ and Android)
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `${cardData.name}'s Business Card`,
                        text: `Check out ${cardData.name}'s digital business card:\n${shareUrl}`,
                        url: shareUrl
                    });
                    console.log('Share successful');
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        showCopyOption(shareUrl, vCardData);
                    }
                }
            } else {
                // Fallback for browsers without Web Share API - show both links
                showCopyOption(shareUrl, vCardData);
            }
        });
    }

    // Show share options with two links
    function showCopyOption(shareUrl, vCardData) {
        const vCardBlob = new Blob([vCardData], { type: 'text/vcard' });
        const vCardUrl = URL.createObjectURL(vCardBlob);
        const cardName = inputs.name.value.trim();

        // Create overlay with proper CSS classes
        const overlay = document.createElement('div');
        overlay.className = 'share-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'share-dialog';
        dialog.innerHTML = `
            <h3>Share This Card</h3>
            <p class="share-subtitle">Choose how to share:</p>

            <a href="${shareUrl}" target="_blank" class="share-action share-action-website">
                <i class="fa-solid fa-globe"></i> Open Website
            </a>
            <p class="share-action-hint">View the digital business card</p>

            <a href="${vCardUrl}" download="${encodeURIComponent(cardName)}.vcf" class="share-action share-action-contact">
                <i class="fa-solid fa-address-book"></i> Save Contact
            </a>
            <p class="share-action-hint">Download as vCard to save to contacts</p>

            <div class="share-copy-section">
                <p>Or copy the website link:</p>
                <div class="share-copy-row">
                    <input type="text" value="${shareUrl}" readonly>
                    <button id="copy-link-btn">Copy</button>
                </div>
            </div>
            <button class="share-close-btn">Close</button>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        function closeModal() {
            document.body.removeChild(overlay);
            URL.revokeObjectURL(vCardUrl);
        }

        // Copy functionality
        dialog.querySelector('#copy-link-btn').addEventListener('click', function () {
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    this.textContent = 'Copied!';
                    this.style.background = '#8CC63F';
                })
                .catch(() => {
                    dialog.querySelector('.share-copy-row input').select();
                    document.execCommand('copy');
                });
        });

        dialog.querySelector('.share-close-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    // Check URL for shared data on page load
    function loadSharedData() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('data');

        if (sharedData) {
            try {
                const decodedData = JSON.parse(atob(decodeURIComponent(sharedData)));
                
                // Populate form fields
                if (decodedData.name) inputs.name.value = decodedData.name;
                if (decodedData.designation) inputs.designation.value = decodedData.designation;
                if (decodedData.phone) inputs.phone.value = decodedData.phone;
                if (decodedData.email) inputs.email.value = decodedData.email;
                if (decodedData.location) inputs.location.value = decodedData.location;

                // Update card preview
                updateCard();
                
                console.log('Loaded shared card data');
            } catch (error) {
                console.error('Error loading shared data:', error);
            }
        }
    }

    // Load shared data when page loads
    loadSharedData();
});
