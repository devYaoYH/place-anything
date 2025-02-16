const uploadButton = document.getElementById('uploadButton');
const fileInput = document.getElementById('fileElem');
const thumbnailContainer = document.getElementById('thumbnailContainer');
const downloadButton = document.getElementById('downloadButton');
const mainContent = document.querySelector('.main-content');
const bgUploadButton = document.getElementById('bgUploadButton');
const bgFileInput = document.getElementById('bgFileElem');
const processButton = document.getElementById('processButton');

let imageCounter = 0;

// Initialize controls
const denoisingSlider = document.getElementById('denoisingStrength');
const denoisingValue = document.getElementById('denoisingValue');
const promptInput = document.getElementById('promptInput');
const useMaskToggle = document.getElementById('useMaskToggle');

// Update denoising value display
denoisingSlider.addEventListener('input', function() {
    denoisingValue.textContent = this.value;
});

// Handle background upload button click
bgUploadButton.addEventListener('click', () => bgFileInput.click());

// Handle background file input change
bgFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            mainContent.style.backgroundImage = `url(${e.target.result})`;
        };
        reader.readAsDataURL(file);
    }
});

// Handle upload button click
uploadButton.addEventListener('click', () => fileInput.click());

// Handle file input change
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    [...files].forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    createThumbnail(img);
                    createDraggableImage(img);
                };
            };
            reader.readAsDataURL(file);
        }
    });
}

function createThumbnail(img) {
    const thumbnail = document.createElement('img');
    thumbnail.src = img.src;
    thumbnail.classList.add('thumbnail');
    thumbnail.addEventListener('click', () => {
        createDraggableImage(img);
    });
    thumbnailContainer.appendChild(thumbnail);
}

function createDraggableImage(img) {
    const draggableDiv = document.createElement('div');
    draggableDiv.id = `drag-${imageCounter++}`;
    draggableDiv.className = 'draggable';
    draggableDiv.setAttribute('data-rotation', '0');
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-button';
    removeButton.innerHTML = '×';
    removeButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent drag event from firing
        draggableDiv.remove();
    });
    
    const rotateButton = document.createElement('button');
    rotateButton.className = 'rotate-button';
    rotateButton.innerHTML = '⟳';
    
    let isRotating = false;
    let startAngle = 0;
    let currentRotation = 0;
    
    rotateButton.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isRotating = true;
        const rect = draggableDiv.getBoundingClientRect();
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        startAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
        currentRotation = parseInt(draggableDiv.getAttribute('data-rotation')) || 0;
        
        // Add event listeners to document
        document.addEventListener('mousemove', handleRotate);
        document.addEventListener('mouseup', stopRotate);
    });
    
    function handleRotate(e) {
        if (!isRotating) return;
        const rect = draggableDiv.getBoundingClientRect();
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
        
        const angle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
        const rotation = currentRotation + (angle - startAngle) * (180 / Math.PI);
        
        draggableDiv.style.transform = `translate(${draggableDiv.getAttribute('data-x') || 0}px, ${draggableDiv.getAttribute('data-y') || 0}px) rotate(${rotation}deg)`;
        draggableDiv.setAttribute('data-rotation', rotation);
    }
    
    function stopRotate() {
        isRotating = false;
        document.removeEventListener('mousemove', handleRotate);
        document.removeEventListener('mouseup', stopRotate);
    }
    
    const imageElement = document.createElement('img');
    imageElement.src = img.src;
    
    draggableDiv.appendChild(removeButton);
    draggableDiv.appendChild(rotateButton);
    draggableDiv.appendChild(imageElement);
    mainContent.appendChild(draggableDiv);
}

// Function to extract main content with background
async function extractMainContentAsImage() {
    const mainContent = document.querySelector('.main-content');
    return await html2canvas(mainContent);
}

// Function to extract objects without background
async function extractObjectsAsImage() {
    const mainContent = document.querySelector('.main-content');
    const currentBackground = mainContent.style.backgroundImage;
    const currentBackgroundColor = mainContent.style.backgroundColor;

    // Remove background temporarily
    mainContent.style.backgroundImage = 'none';
    mainContent.style.backgroundColor = 'transparent';

    // Capture without background
    const canvas = await html2canvas(mainContent, {
        backgroundColor: null,
        removeContainer: true
    });

    // Restore background
    mainContent.style.backgroundImage = currentBackground;
    mainContent.style.backgroundColor = currentBackgroundColor;

    return canvas;
}

// Function to create a binary mask from an image with transparency
async function createBinaryMaskFromImage(imageData, invert = false) {
    return new Promise((resolve, reject) => {
        // Create a temporary image to load the data
        const img = new Image();
        
        img.onload = () => {
            // Create a canvas of the same size
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            // Draw the image
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imgData.data;

            // Process each pixel
            for (let i = 0; i < pixels.length; i += 4) {
                const alpha = pixels[i + 3]; // Alpha channel
                
                // If pixel is transparent (alpha < 128)
                const isTransparent = alpha < 128;
                
                // Set color based on transparency and invert flag
                const color = (isTransparent !== invert) ? 0 : 255;
                
                // Set RGB channels to black or white
                pixels[i] = color;     // R
                pixels[i + 1] = color; // G
                pixels[i + 2] = color; // B
                pixels[i + 3] = 255;   // A (fully opaque)
            }

            // Put the modified pixels back
            ctx.putImageData(imgData, 0, 0);

            // Resolve with base64 string of the mask
            resolve(canvas.toDataURL('image/png').split(',')[1]);
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = `data:image/png;base64,${imageData}`;
    });
}

// Function to hide UI elements
function hideUIElements() {
    const removeButtons = document.querySelectorAll('.remove-button');
    const rotateButtons = document.querySelectorAll('.rotate-button');
    const draggables = document.querySelectorAll('.draggable');
    
    removeButtons.forEach(button => button.style.display = 'none');
    rotateButtons.forEach(button => button.style.display = 'none');
    draggables.forEach(drag => drag.classList.add('capturing'));
    
    return { removeButtons, rotateButtons, draggables };
}

// Function to restore UI elements
function restoreUIElements(elements) {
    elements.removeButtons.forEach(button => button.style.display = 'flex');
    elements.rotateButtons.forEach(button => button.style.display = 'flex');
    elements.draggables.forEach(drag => drag.classList.remove('capturing'));
}

// Download button click handler
document.getElementById('downloadButton').addEventListener('click', async function() {
    const uiElements = hideUIElements();

    try {
        // Capture both versions of the image
        const [canvasWithBg, canvasWithoutBg] = await Promise.all([
            extractMainContentAsImage(),
            extractObjectsAsImage()
        ]);

        // Create download links
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Download with background
        const linkWithBg = document.createElement('a');
        linkWithBg.download = `bouquet_${timestamp}.png`;
        linkWithBg.href = canvasWithBg.toDataURL('image/png');
        linkWithBg.click();

        // Download without background
        const linkWithoutBg = document.createElement('a');
        linkWithoutBg.download = `bouquet_${timestamp}_masked.png`;
        linkWithoutBg.href = canvasWithoutBg.toDataURL('image/png');
        linkWithoutBg.click();

    } catch (error) {
        console.error('Error downloading images:', error);
        alert('Failed to download images. Please try again.');
    } finally {
        restoreUIElements(uiElements);
    }
});

// Handle process button click
processButton.addEventListener('click', async function() {
    const uiElements = hideUIElements();
    this.disabled = true;
    this.textContent = 'Processing...';

    try {
        // Capture the current state using the extraction function
        const canvas = await extractMainContentAsImage();
        const imageData = canvas.toDataURL('image/png').split(',')[1];

        // Prepare request body
        const requestBody = {
            prompt: promptInput.value.trim(),
            denoising_strength: parseFloat(denoisingSlider.value),
            init_images: [
                imageData
            ]
        };

        // Add mask if toggle is enabled
        if (useMaskToggle.checked) {
            const maskCanvas = await extractObjectsAsImage();
            const maskData = await createBinaryMaskFromImage(
                maskCanvas.toDataURL('image/png').split(',')[1],
                true
            );
            requestBody.mask = maskData;
            requestBody.inpainting_fill = 1;
        }

        let request = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        };

        // Make API call to img2img endpoint through proxy
        const response = await fetch('http://localhost:3000/proxy/img2img', request);

        if (!response.ok) {
            console.log(request);
            throw new Error('Failed to process image');
        }

        // Get the processed image data
        const result = await response.json();
        console.log(result);

        // Set the processed image as the background
        mainContent.style.backgroundImage = `url(data:image/png;base64,${result.images[0]})`;
        mainContent.style.backgroundSize = 'cover';
        mainContent.style.backgroundPosition = 'center';
    } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try again.');
    } finally {
        restoreUIElements(uiElements);
        this.disabled = false;
        this.textContent = 'Process with AI';
    }
});
