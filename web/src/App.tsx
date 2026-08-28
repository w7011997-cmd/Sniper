import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Snooker App</h1>
      <p>Dashboard, challenges, betting, and match view will live here.</p>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
    </div>
  );
}

function Dashboard() {
  return <h2>Live matches dashboard (placeholder)</h2>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
