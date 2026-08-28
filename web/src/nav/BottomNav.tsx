import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Live", end: true },
  { to: "/matches", label: "Find Opponent" },
  { to: "/rankings", label: "Rankings" },
  { to: "/messages", label: "Messages" },
  { to: "/profile", label: "Profile" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => "bottom-nav-item" + (isActive ? " bottom-nav-active" : "")}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
