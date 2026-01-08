/* ========================================
   POFSTUDIO Chat Widget
   ======================================== */

// Chat AI Responses (Predefined responses for common questions)
const chatResponses = {
    greetings: [
        'สวัสดีค่ะ! 🌸 ยินดีต้อนรับสู่ POFSTUDIO ช่วยอะไรได้บ้างคะ?',
        'หวัดดีค่ะ! 💕 มีอะไรให้ช่วยไหมคะ?',
        'สวัสดีค่ะ! 🎨 POFSTUDIO พร้อมช่วยเหลือคุณค่ะ'
    ],
    services: [
        'POFSTUDIO มีบริการหลากหลายค่ะ:\n\n🖼️ **POFIMAGE** - ภาพประกอบน่ารัก\n🎬 **POFANIMATION** - อนิเมชั่น\n🎵 **POFSONG** - เพลงและดนตรี\n📚 **POFFRIEND** - สื่อการสอนเด็ก\n🛒 **POFSHOP** - สินค้าน่ารัก\n\nสนใจบริการไหนเป็นพิเศษคะ?'
    ],
    contact: [
        'ติดต่อเราได้หลายช่องทางค่ะ:\n\n📧 Email: poffog@gmail.com\n📘 Facebook: POFSTUDIO\n📷 Instagram: @that.isnotlove\n🎬 YouTube: @PofStudio\n🎵 TikTok: @princeofhug\n\nหรือกดปุ่ม "ส่งอีเมล" ด้านบนได้เลยค่ะ!'
    ],
    price: [
        'ราคาขึ้นอยู่กับขอบเขตงานค่ะ 💰\n\nกรุณาส่งรายละเอียดงานมาทาง Email: poffog@gmail.com\nแล้วเราจะตอบกลับพร้อมใบเสนอราคาค่ะ! 📝'
    ],
    about: [
        'POFSTUDIO คือสตูดิโอสร้างสรรค์ผลงานน่ารักสำหรับเด็ก 🌈\n\nเราทำงานด้านกราฟิก อนิเมชั่น เพลง และสื่อการเรียนรู้มากว่า 5 ปี\n\n✨ ผลงาน 100+ ชิ้น\n📦 โปรเจกต์ 50+ งาน\n💕 ลูกค้าน่ารักมากมาย'
    ],
    thanks: [
        'ยินดีค่ะ! 💕 มีอะไรถามเพิ่มเติมได้เสมอนะคะ',
        'ด้วยความยินดีค่ะ! 🌸 ขอบคุณที่สนใจ POFSTUDIO',
        'ไม่เป็นไรค่ะ! 😊 ติดต่อมาได้ตลอดเลยนะคะ'
    ],
    default: [
        'ขอบคุณสำหรับข้อความค่ะ! 😊\n\nหากต้องการสอบถามเพิ่มเติม กรุณาติดต่อ:\n📧 poffog@gmail.com\n\nเราจะตอบกลับโดยเร็วที่สุดค่ะ! 💕',
        'รับทราบค่ะ! 🌸\n\nสำหรับคำถามเฉพาะทาง กรุณาติดต่อทีมงานโดยตรงที่ poffog@gmail.com นะคะ',
        'ขอบคุณค่ะ! 💕 ทีมงานจะติดต่อกลับทาง Email เร็วๆ นี้ค่ะ'
    ]
};

// Keywords for matching
const keywords = {
    greetings: ['สวัสดี', 'หวัดดี', 'hello', 'hi', 'ดี', 'หวัด'],
    services: ['บริการ', 'ทำอะไร', 'มีอะไรบ้าง', 'service', 'ทำได้', 'รับทำ', 'ภาพ', 'อนิเมชั่น', 'เพลง', 'animation'],
    contact: ['ติดต่อ', 'เบอร์', 'โทร', 'email', 'อีเมล', 'facebook', 'ig', 'line', 'contact'],
    price: ['ราคา', 'เท่าไหร่', 'ค่า', 'price', 'cost', 'งบ', 'ตังค์'],
    about: ['เกี่ยวกับ', 'คือใคร', 'ประวัติ', 'about', 'who', 'ประสบการณ์'],
    thanks: ['ขอบคุณ', 'thanks', 'thank', 'thx', 'ขอบใจ', 'ok', 'โอเค']
};

// Initialize Chat
document.addEventListener('DOMContentLoaded', initChat);

function initChat() {
    const chatToggle = document.getElementById('chatToggle');
    const chatPopup = document.getElementById('chatPopup');
    const chatClose = document.getElementById('chatClose');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    if (!chatToggle || !chatPopup) return;

    // Toggle chat popup
    chatToggle.addEventListener('click', () => {
        chatToggle.classList.toggle('active');
        chatPopup.classList.toggle('active');

        if (chatPopup.classList.contains('active')) {
            chatInput.focus();
        }
    });

    // Close button
    chatClose.addEventListener('click', () => {
        chatToggle.classList.remove('active');
        chatPopup.classList.remove('active');
    });

    // Send message
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();

        if (!message) return;

        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';

        // Show typing indicator
        showTyping();

        // Generate AI response
        setTimeout(() => {
            hideTyping();
            const response = generateResponse(message);
            addMessage(response, 'bot');
        }, 1000 + Math.random() * 500);
    });

    // Add initial greeting
    setTimeout(() => {
        if (chatMessages.children.length === 0) {
            addMessage(getRandomResponse('greetings'), 'bot');
        }
    }, 500);
}

function addMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.innerHTML = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing-message';
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
    const typingMessage = document.querySelector('.typing-message');
    if (typingMessage) {
        typingMessage.remove();
    }
}

function generateResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Check each category
    for (const [category, words] of Object.entries(keywords)) {
        for (const word of words) {
            if (lowerMessage.includes(word)) {
                return getRandomResponse(category);
            }
        }
    }

    // Default response
    return getRandomResponse('default');
}

function getRandomResponse(category) {
    const responses = chatResponses[category] || chatResponses.default;
    return responses[Math.floor(Math.random() * responses.length)];
}
