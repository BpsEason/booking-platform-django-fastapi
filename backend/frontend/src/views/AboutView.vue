<template>
  <div class="about-view">
    <h1 class="mb-4">About Our Booking Platform</h1>
    <p>This is a modern booking platform designed to connect users with various service providers (merchants).</p>
    <p>It features a robust Django REST Framework backend for core functionalities like user management, merchant listings, and appointment scheduling.</p>
    <p>A high-performance FastAPI service provides real-time recommendations, leveraging Redis for fast data access.</p>
    <p>The user-friendly frontend is built with Vue.js, offering a seamless booking experience.</p>

    <h2 class="mt-5 mb-3">Key Technologies Used:</h2>
    <ul>
      <li><strong>Backend:</strong> Django REST Framework (Python)</li>
      <li><strong>Recommendation Engine:</strong> FastAPI (Python)</li>
      <li><strong>Frontend:</strong> Vue.js 3 (JavaScript)</li>
      <li><strong>Database:</strong> MySQL 8</li>
      <li><strong>Caching/Messaging:</strong> Redis</li>
      <li><strong>Containerization:</strong> Docker & Docker Compose</li>
      <li><strong>Web Server/Reverse Proxy:</strong> Nginx</li>
      <li><strong>Monitoring:</strong> Prometheus & Grafana</li>
    </ul>

    <h2 class="mt-5 mb-3">Features:</h2>
    <ul>
      <li>User registration and authentication (JWT)</li>
      <li>Merchant listing and detail pages</li>
      <li>Service Browse and booking</li>
      <li>User profile management</li>
      <li>Merchant administration dashboard (for managing services and appointments)</li>
      <li>Personalized merchant recommendations</li>
      <li>Basic health monitoring via Prometheus and Grafana</li>
    </ul>

    <p class="mt-5">This project aims to demonstrate a complete, modern web application architecture.</p>
  </div>
</template>

<style scoped>
.about-view {
  max-width: 800px;
  margin: 50px auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
h1, h2 {
  color: #333;
}
ul {
  list-style-type: disc;
  padding-left: 20px;
}
li {
  margin-bottom: 8px;
}
</style>

