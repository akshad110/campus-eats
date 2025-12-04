# 🍔 Campus Eats – Smart Takeaway Food Ordering Platform  
### 🚀 Reducing Campus Rush with a Real-Time Dynamic Token System

![Static Badge](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)
![Static Badge](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Static Badge](https://img.shields.io/badge/Database-MySQL-orange)
![Static Badge](https://img.shields.io/badge/Real--Time-WebSockets-purple)
![Static Badge](https://img.shields.io/badge/Styling-TailwindCSS-38B2AC)

---

## ⭐ Overview

**Campus Eats** is a takeaway-focused food ordering platform designed for college campuses.  
To avoid heavy rush and overcrowding, the system uses a **Dynamic Token System** that assigns a unique token to each order.

🔗 **Live Preview:** https://takeaway-7f04.onrender.com  
🔗 **Repository:** https://github.com/akshad110/campus-eats

---

## 🎯 Features

### 🔢 Dynamic Token System
- Unique token generation  
- Real-time WebSocket updates  
- Reduces queues and crowd  
- Stall owners can update token status  

### 🍽️ Ordering System
- Menu browsing  
- Add to cart  
- Smooth checkout flow  

### 🧑‍💻 Authentication
- Login / Register  
- Secure sessions  

### 📡 Real-Time Tracking
- Live token position  
- Order preparation status  
- “Ready for pickup” indicator  

### 🎨 Modern UI/UX
- Built with **React + TypeScript**  
- Styled using **Tailwind CSS**  
- Fully responsive  

---

## 🧰 Tech Stack

### 🌐 Frontend
- React  
- TypeScript  
- TailwindCSS  
- Axios  

### 🖥️ Backend
- Node.js  
- Express.js  
- Socket.io  
- MySQL  

---

## 📸 Screenshots

**Home Page**
<img width="1915" height="907" alt="Screenshot 2025-12-04 220549" src="https://github.com/user-attachments/assets/9b8262ae-a5c2-4479-b65a-ac28d2137bba" />

** ShopKeeper DashBaord
<img width="1919" height="909" alt="image" src="https://github.com/user-attachments/assets/b76773ed-a57c-44d2-bf8a-c4cea267c74a" />

---

## 🧪 Running the Project Locally

### 📂 1. Clone the repository
```bash
git clone https://github.com/akshad110/campus-eats
cd campus-eats

▶️ 2. Run Frontend
cd frontend
npm install
npm run dev

▶️ 3. Run Backend
cd backend
npm install
npm start


📌 Make sure to configure your .env file with MySQL credentials
Example:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=campuseats
