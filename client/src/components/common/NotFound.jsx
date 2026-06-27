import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6 animate-bounce-slow">🍕</div>
        <h1 className="text-6xl font-display font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          Oops! Looks like this page got eaten. Let's get you back to the good stuff.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/')} className="btn-primary btn-lg">
            🏠 Go Home
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary btn-lg">
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;