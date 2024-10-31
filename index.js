const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(express.json());

// Lấy các thông tin PayOS từ biến môi trường
const clientId = process.env.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY;
const checksumKey = process.env.PAYOS_CHECKSUM_KEY;

// Hàm tạo checksum để bảo mật yêu cầu
function createChecksum(amount, currency) {
    const checksumString = clientId + apiKey + amount + currency + checksumKey;
    return crypto.createHash('sha256').update(checksumString).digest('hex');
}

// Endpoint để tạo link thanh toán
app.post('/createPayment', async (req, res) => {
    const { amount, currency, orderInfo } = req.body;

    // Tạo checksum
    const checksum = createChecksum(amount, currency);

    // Payload gửi tới PayOS với URL mới
    const payload = {
        clientId,
        apiKey,
        amount,
        currency,
        orderInfo,
        checksum
    };

    try {
        // Gọi API của PayOS để tạo đơn hàng với URL mới
        const response = await axios.post('https://api-merchant.payos.vn/v2/payment-requests', payload);
        if (response.data && response.data.paymentUrl) {
            res.json({ paymentUrl: response.data.paymentUrl });
        } else {
            res.status(500).json({ error: "Failed to get payment URL from PayOS." });
        }
    } catch (error) {
        console.error("Error creating payment:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint để kiểm tra server
app.get('/', (req, res) => {
    res.send('Server is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
