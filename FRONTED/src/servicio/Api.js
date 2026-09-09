import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Ajusta el puerto si tu backend corre en otro
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;