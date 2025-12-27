import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              TEB ML
            </Link>
          </div>
          <nav className="flex space-x-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link to="/analytics" className="text-gray-600 hover:text-gray-900">
              Analytics
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;