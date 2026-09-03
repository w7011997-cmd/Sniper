import { NavLink } from "react-router-dom";
import { Radio, Swords, Trophy, MessageCircle, User } from "lucide-react";
import { usePendingChallengeCount } from "../challenges/usePendingChallengeCount";
import { useConversations } from "../messages/useConversations";

const items = [
  { to: "/", label: "Live", end: true, Icon: Radio },
  { to: "/matches", label: "Find Opponent", Icon: Swords, badge: true },
  { to: "/rankings", label: "Rankings", Icon: Trophy },
  { to: "/messages", label: "Messages", Icon: MessageCircle, badge: "messages" as const },
  { to: "/profile", label: "Profile", Icon: User },
];

export default function BottomNav() {
  const pendingCount = usePendingChallengeCount();
  const { totalUnread } = useConversations();

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => "bottom-nav-item" + (isActive ? " bottom-nav-active" : "")}
        >
          <span className="bottom-nav-icon-wrap">
            <item.Icon size={20} strokeWidth={2} />
            {item.badge === true && pendingCount > 0 && (
              <span className="bottom-nav-badge">{pendingCount > 9 ? "9+" : pendingCount}</span>
            )}
            {item.badge === "messages" && totalUnread > 0 && (
              <span className="bottom-nav-badge">{totalUnread > 9 ? "9+" : totalUnread}</span>
            )}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
