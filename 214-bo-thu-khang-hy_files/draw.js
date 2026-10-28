const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const colorInput = document.getElementById('color');
const sizeInput = document.getElementById('size');
const sizeValue = document.getElementById('sizeValue');

let drawing = false;

// Cấu hình nét vẽ
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// Thiết lập kích thước canvas theo màn hình
function resizeCanvas() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (!width || !height) return;

    // Lưu hình cũ để không mất nét khi đổi kích thước
    const oldCanvas = document.createElement('canvas');
    oldCanvas.width = canvas.width;
    oldCanvas.height = canvas.height;
    oldCanvas.getContext('2d').drawImage(canvas, 0, 0);

    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (oldCanvas.width && oldCanvas.height) {
        ctx.drawImage(
            oldCanvas,
            0, 0, oldCanvas.width, oldCanvas.height,
            0, 0, canvas.width, canvas.height
        );
    }

    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
}

// Lấy tọa độ con trỏ
function getPosition(e) {
    const rect = canvas.getBoundingClientRect();

    return {
        x: e.clientX - rect.left - canvas.clientLeft,
        y: e.clientY - rect.top - canvas.clientTop
    };
}

// Bắt đầu vẽ
canvas.addEventListener('pointerdown', e => {
    drawing = true;
    canvas.setPointerCapture(e.pointerId);

    const pos = getPosition(e);

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
});

// Vẽ nét
canvas.addEventListener('pointermove', e => {
    if (!drawing) return;

    const pos = getPosition(e);

    ctx.strokeStyle = colorInput.value;
    ctx.lineWidth = Number(sizeInput.value);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
});

// Kết thúc vẽ
function stopDrawing() {
    drawing = false;
    ctx.beginPath();
}

canvas.addEventListener('pointerup', stopDrawing);
canvas.addEventListener('pointercancel', stopDrawing);

// Thay đổi cỡ nét
sizeInput.addEventListener('input', () => {
    document.getElementById('draw_penSize_div').style.width = sizeInput.value * 1.5  + 'px';
    document.getElementById('draw_penSize_div').style.height = sizeInput.value * 1.5  + 'px';
});

// Xóa toàn bộ
document.getElementById('clear').addEventListener('click', () => {
    clearDraw(); //ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
});

document.getElementById('color').addEventListener('change', () => {
    document.getElementById('draw_penSize_div').style.backgroundColor = document.getElementById('color').value;
    document.getElementById('size').style.accentColor = document.getElementById('color').value;    
});


/*
// Lưu hình PNG
document.getElementById('save').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'hinh-ve.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});*/

// Canvas starts hidden and needs sizing when the drawing panel becomes visible.
const resizeObserver = new ResizeObserver(() => resizeCanvas());
resizeObserver.observe(canvas);

const drawPanel = document.getElementById('draw');
const visibilityObserver = new MutationObserver(() => {
    if (drawPanel.getClientRects().length) resizeCanvas();
});
visibilityObserver.observe(drawPanel, { attributes: true, attributeFilter: ['style'] });

const hideDraw = () =>
{
    document.getElementById('divCheDraw').style.display='none';
    document.getElementById('draw').style.display='none';
}


const showDraw = () =>
{
    document.getElementById('divCheDraw').style.display='block';
    document.getElementById('draw').style.display='grid';
    if (newWord)
    {
        clearDraw();
        newWord = false;
    }    
}


const clearDraw = () =>
{
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}