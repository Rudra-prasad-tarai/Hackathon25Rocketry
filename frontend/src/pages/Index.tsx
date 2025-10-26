import { useState } from 'react';
import IntroAnimation from '@/components/IntroAnimation';
import Header from '@/components/Header';
import RepositoryForm from '@/components/RepositoryForm';

const Index = () => {
  const [showContent, setShowContent] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <IntroAnimation onComplete={() => setShowContent(true)} />
      
      <Header />
      
      {showContent && (
        <main className="container mx-auto px-4 py-24 md:py-32">
          <RepositoryForm />
        </main>
      )}
    </div>
  );
};

export default Index;
