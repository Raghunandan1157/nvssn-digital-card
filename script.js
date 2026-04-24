document.addEventListener('DOMContentLoaded', () => {

    // Form input elements
    const inputs = {
        name: document.getElementById('name'),
        designation: document.getElementById('designation'),
        company: document.getElementById('company'),
        phone: document.getElementById('phone'),
        cell: document.getElementById('cell'),
        email: document.getElementById('email'),
        website: document.getElementById('website'),
        location: document.getElementById('location')
    };

    // Preview elements on the card
    const preview = {
        name: document.getElementById('preview-name'),
        designation: document.getElementById('preview-designation'),
        company: document.getElementById('preview-company'),
        phone: document.getElementById('preview-phone'),
        cell: document.getElementById('preview-cell'),
        email: document.getElementById('preview-email'),
        website: document.getElementById('preview-website'),
        location: document.getElementById('preview-location')
    };

    const jsonOutput = document.getElementById('json-output');
    const qrContainer = document.getElementById('qr-code');

    // Initialize QR code instance
    let qrCode = new QRCode(qrContainer, {
        text: ' ',
        width: 180,
        height: 180,
        colorDark: '#1a5fbf',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function normalizeWebsite(url) {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        return 'https://' + url.replace(/^\/+/, '');
    }

    /**
     * Generates a vCard string from the current form data
     */
    function generateVCard(data) {
        const cleanPhone = (data.phone || '').replace(/[\s\-]/g, '');
        const cleanCell = (data.cell || '').replace(/[\s\-]/g, '');

        const nameParts = data.name.split(' ');
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const firstName = nameParts.slice(0, -1).join(' ') || data.name;

        const lines = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${data.name}`,
            `N:${lastName};${firstName};;;`,
            `TITLE:${data.designation}`,
            `ORG:${data.company}`
        ];

        if (cleanPhone) lines.push(`TEL;TYPE=WORK,VOICE:${cleanPhone}`);
        if (cleanCell) lines.push(`TEL;TYPE=CELL:${cleanCell}`);
        if (data.email) lines.push(`EMAIL:${data.email}`);
        if (data.website) lines.push(`URL:${normalizeWebsite(data.website)}`);
        if (data.location) lines.push(`ADR;TYPE=WORK:;;${data.location.replace(/\n/g, ', ')};;;;`);

        lines.push('END:VCARD');
        return lines.join('\n');
    }

    let qrTimer = null;

    function updateCard() {
        const cardData = {
            name: inputs.name.value.trim(),
            designation: inputs.designation.value.trim(),
            company: inputs.company.value.trim(),
            phone: inputs.phone.value.trim(),
            cell: inputs.cell.value.trim(),
            email: inputs.email.value.trim(),
            website: inputs.website.value.trim(),
            location: inputs.location.value.trim()
        };

        jsonOutput.textContent = JSON.stringify(cardData, null, 2);

        preview.name.textContent = cardData.name || 'Your Name';
        preview.designation.textContent = cardData.designation || 'Designation';
        preview.company.textContent = cardData.company || 'Company Name';
        preview.phone.textContent = cardData.phone || '—';
        preview.cell.textContent = cardData.cell || '—';
        preview.email.textContent = cardData.email || 'email@example.com';
        preview.website.textContent = cardData.website || 'www.example.com';
        preview.location.textContent = cardData.location.replace(/\n/g, ', ') || 'Head Office Address';

        clearTimeout(qrTimer);
        qrTimer = setTimeout(() => {
            const vCardString = generateVCard(cardData);
            qrCode.clear();
            qrCode.makeCode(vCardString);
        }, 300);
    }

    Object.values(inputs).forEach(el => {
        if (!el) return;
        el.addEventListener('input', updateCard);
        el.addEventListener('change', updateCard);
    });

    updateCard();

    // Share button
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const cardData = {
                name: inputs.name.value.trim(),
                designation: inputs.designation.value.trim(),
                company: inputs.company.value.trim(),
                phone: inputs.phone.value.trim(),
                cell: inputs.cell.value.trim(),
                email: inputs.email.value.trim(),
                website: inputs.website.value.trim(),
                location: inputs.location.value.trim()
            };

            const shareData = btoa(JSON.stringify(cardData));
            const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(shareData)}`;
            const vCardData = generateVCard(cardData);

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: `${cardData.name}'s Business Card`,
                        text: `Check out ${cardData.name}'s digital business card:\n${shareUrl}`,
                        url: shareUrl
                    });
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        showCopyOption(shareUrl, vCardData);
                    }
                }
            } else {
                showCopyOption(shareUrl, vCardData);
            }
        });
    }

    // Copy links button
    const copyButton = document.getElementById('copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const cardData = {
                name: inputs.name.value.trim(),
                designation: inputs.designation.value.trim(),
                company: inputs.company.value.trim(),
                phone: inputs.phone.value.trim(),
                cell: inputs.cell.value.trim(),
                email: inputs.email.value.trim(),
                website: inputs.website.value.trim(),
                location: inputs.location.value.trim()
            };

            const shareData = btoa(JSON.stringify(cardData));
            const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(shareData)}`;
            const websiteUrl = normalizeWebsite(cardData.website);

            const copyText = `${cardData.name} | ${cardData.designation}\n${cardData.company}\n\nSave Contact: ${shareUrl}\nOpen Website: ${websiteUrl}`;

            navigator.clipboard.writeText(copyText)
                .then(() => {
                    copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fa-solid fa-copy"></i> Copy Links';
                    }, 2000);
                })
                .catch(() => {
                    const ta = document.createElement('textarea');
                    ta.value = copyText;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    copyButton.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fa-solid fa-copy"></i> Copy Links';
                    }, 2000);
                });
        });
    }

    function showCopyOption(shareUrl, vCardData) {
        const vCardBlob = new Blob([vCardData], { type: 'text/vcard' });
        const vCardUrl = URL.createObjectURL(vCardBlob);
        const cardName = inputs.name.value.trim();
        const cardDesignation = inputs.designation.value.trim();
        const websiteUrl = normalizeWebsite(inputs.website.value.trim());

        const overlay = document.createElement('div');
        overlay.className = 'share-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'share-dialog';
        dialog.innerHTML = `
            <div class="share-person">
                <h3 class="share-person-name">${escapeHtml(cardName)}</h3>
                <p class="share-person-designation">${escapeHtml(cardDesignation)}</p>
            </div>

            <div class="share-links">
                <a href="${vCardUrl}" download="${encodeURIComponent(cardName)}.vcf" class="share-link-row">
                    <span class="share-link-label"><i class="fa-solid fa-address-book"></i> Save Contact</span>
                    <span class="share-link-arrow"><i class="fa-solid fa-arrow-right"></i></span>
                </a>
                <a href="${websiteUrl}" target="_blank" rel="noopener" class="share-link-row">
                    <span class="share-link-label"><i class="fa-solid fa-globe"></i> Open Website</span>
                    <span class="share-link-arrow"><i class="fa-solid fa-arrow-right"></i></span>
                </a>
            </div>

            <button class="share-close-btn">Close</button>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        function closeModal() {
            document.body.removeChild(overlay);
            URL.revokeObjectURL(vCardUrl);
        }

        dialog.querySelector('.share-close-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    function loadSharedData() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('data');

        if (sharedData) {
            try {
                const decodedData = JSON.parse(atob(decodeURIComponent(sharedData)));

                if (decodedData.name) inputs.name.value = decodedData.name;
                if (decodedData.designation) inputs.designation.value = decodedData.designation;
                if (decodedData.company) inputs.company.value = decodedData.company;
                if (decodedData.phone) inputs.phone.value = decodedData.phone;
                if (decodedData.cell) inputs.cell.value = decodedData.cell;
                if (decodedData.email) inputs.email.value = decodedData.email;
                if (decodedData.website) inputs.website.value = decodedData.website;
                if (decodedData.location) inputs.location.value = decodedData.location;

                updateCard();
            } catch (error) {
                console.error('Error loading shared data:', error);
            }
        }
    }

    loadSharedData();
});
