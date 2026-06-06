import React, { useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import FeaturedSection from '../components/FeaturedSection';
import TrailersSection from '../components/TrailersSection';
import { useAppContext } from '../context/AppContext';

const Home = () => {
  const { userLocation, setShowLocationModal } = useAppContext();

  useEffect(() => {
    // Force open modal if city is still the default "Select City"
    if (userLocation.city === "Select City") {
        setShowLocationModal(true);
    }
  }, [userLocation.city, setShowLocationModal]);

  return (
    <div className="w-full flex flex-col overflow-hidden">
      <HeroSection />
      <FeaturedSection />
      <TrailersSection />
    </div>
  );
};

export default Home;