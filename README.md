# Basic E-Commerce Backend

Backend cho hệ thống e-commerce, xây dựng bằng Node.js và Express.

## Mục đích

Dự án này cung cấp API cho web e-commerce và admin panel, xử lý logic nghiệp vụ, xác thực, quản lý dữ liệu sản phẩm, đơn hàng, người dùng, v.v.

## Tính năng chính

- API quản lý sản phẩm, đơn hàng, người dùng
- Xác thực JWT
- Kết nối cơ sở dữ liệu
- Hỗ trợ socket cho thông báo/thanh toán realtime (nếu có)

## Cài đặt & Chạy dự án

1. Cài đặt dependencies:

```bash
npm install
```

2. Tạo file .env từ .env.example (nếu có)
3. Chạy server phát triển:

```bash
npm run dev
```

Server sẽ chạy tại http://localhost:3001 (hoặc cổng bạn cấu hình).

## Cấu trúc thư mục

- `src/`: Mã nguồn chính
- `configs/`: Cấu hình kết nối, biến môi trường
- `helpers/`, `utils/`: Hàm tiện ích
- `types/`: Định nghĩa kiểu dữ liệu

## Tham khảo

- Frontend: [E-commerce Web App](https://github.com/HoaNeee/basic-e-commerce)
- Admin: [Dashboard](https://github.com/HoaNeee/basic-admin-panel)
