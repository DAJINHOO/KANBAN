import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Boards from './pages/Boards';
import Board from './pages/Board';
import './styles.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/boards" element={<Boards />} />
        <Route path="/board/:id" element={<Board />} />
      </Routes>
    </BrowserRouter>
  );
}