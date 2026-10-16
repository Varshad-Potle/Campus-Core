import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <nav className="w-full border-b border-border bg-card px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <GraduationCap className="w-5 h-5 text-primary" />
        <span className="font-semibold text-foreground tracking-tight">CampusCore</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge
          label={user?.role === 'admin' ? 'Admin' : 'Student'}
          variant={user?.role === 'admin' ? 'info' : 'success'}
        />
        <span className="text-sm text-muted-foreground">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}