import { useAuthStore } from '@/store/authStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin',           label: 'Dashboard' },
    { to: '/admin/students',  label: 'Students'  },
    { to: '/admin/companies', label: 'Companies' },
    { to: '/admin/audit',     label: 'Audit Log' },
  ];

  const studentLinks = [
    { to: '/student',           label: 'My Profile'  },
    { to: '/student/companies', label: 'Companies'   },
  ];

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  return (
    <nav className="w-full border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground tracking-tight">CampusCore</span>
        </div>
        <div className="flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                location.pathname === link.to
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge
          label={user?.role === 'admin' ? 'Admin' : 'Student'}
          variant={user?.role === 'admin' ? 'info' : 'success'}
        />
        <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
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