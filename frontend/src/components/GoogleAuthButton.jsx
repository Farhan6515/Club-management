import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

const GoogleAuthButton = ({ onSuccess, text = 'signin_with' }) => {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() => toast.error('Google sign-in failed')}
        theme="filled_black"
        size="large"
        width={width}
        text={text}
        shape="rectangular"
      />
    </div>
  );
};

export default GoogleAuthButton;
