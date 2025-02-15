const uploadButton = document.getElementById('uploadButton');
const fileInput = document.getElementById('fileElem');
const thumbnailContainer = document.getElementById('thumbnailContainer');
const downloadButton = document.getElementById('downloadButton');
const mainContent = document.querySelector('.main-content');
const bgUploadButton = document.getElementById('bgUploadButton');
const bgFileInput = document.getElementById('bgFileElem');

let imageCounter = 0;

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

// Handle download button click
downloadButton.addEventListener('click', () => {
    const mainContent = document.querySelector('.main-content');
    const removeButtons = mainContent.querySelectorAll('.remove-button');
    const draggables = mainContent.querySelectorAll('.draggable');
    
    // Hide UI elements
    removeButtons.forEach(button => button.style.display = 'none');
    draggables.forEach(drag => drag.classList.add('capturing'));
    
    html2canvas(mainContent).then(canvas => {
        // Create a temporary link element
        const link = document.createElement('a');
        link.download = 'bouquet-' + new Date().toISOString().slice(0,10) + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Restore UI elements
        removeButtons.forEach(button => button.style.display = 'flex');
        draggables.forEach(drag => drag.classList.remove('capturing'));
    });
});
