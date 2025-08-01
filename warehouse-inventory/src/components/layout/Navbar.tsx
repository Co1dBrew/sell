import React from 'react';
import { useAuth } from '../../hooks/useAuth.tsx';
import { cn } from '../../lib/utils';

interface NavbarProps {
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const { user, logout } = useAuth();

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50",
      className
    )}>
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-primary">库房商品出入记账系统</h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              欢迎，{user.name}
            </span>
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-primary transition-colors"
            >
              退出登录
            </button>
          </div>
        )}
      </div>
    </header>
  );
};