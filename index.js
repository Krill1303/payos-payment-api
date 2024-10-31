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
        clientId,       // Đảm bảo tên trường này đúng với yêu cầu của PayOS
        apiKey,         // Đảm bảo tên trường này đúng với yêu cầu của PayOS
        amount,
        currency,
        orderInfo,
        checksum
    };
    
    // Log payload và checksum để xác minh
    console.log("Payload sent to PayOS:", payload);

    try {
        // Gọi API của PayOS để tạo đơn hàng với URL mới
        const response = await axios.post('https://api-merchant.payos.vn/v2/payment-requests', payload);
        
        // Log phản hồi từ API PayOS
        console.log("Response from PayOS:", response.data);

        if (response.data && response.data.paymentUrl) {
            res.json({ paymentUrl: response.data.paymentUrl });
        } else {
            console.error("Failed to get payment URL from PayOS:", response.data); // Log chi tiết nếu không nhận được URL
            res.status(500).json({ error: "Failed to get payment URL from PayOS." });
        }
    } catch (error) {
        console.error("Error creating payment:", error.message);
        if (error.response) {
            console.error("Error response from PayOS:", error.response.data); // Log chi tiết lỗi từ PayOS
        }
        res.status(500).json({ error: error.message });
    }
});

// Endpoint để kiểm tra server
app.get('/', (req, res) => {
    res.send('Server is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
