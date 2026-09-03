import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, ShieldCheck, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import { BRANDS, PRODUCTION_STAGES } from './data';
import Header from './components/Header';
import HeroScene from './components/HeroScene';
import ProblemScene from './components/ProblemScene';
import NarrativePanel from './components/NarrativePanel';
import DynamicMockup from './components/DynamicMockup';
import ProgressBar from './components/ProgressBar';
import AccessModal from './components/AccessModal';

export default function App() {
  const [activeBrand, setActiveBrand] = useState(BRANDS[0]);
  const [activeStageId, setActiveStageId] = useState(0);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  const activeStage = PRODUCTION_STAGES[activeStageId];

  const handleNextStage = () => {
    if (activeStageId < PRODUCTION_STAGES.length - 1) {
      setActiveStageId(activeStageId + 1);
    }
  };

  const handlePrevStage = () => {
    if (activeStageId > 0) {
      setActiveStageId(activeStageId - 1);
    }
  };

  const handleSelectStage = (id: number) => {
    setActiveStageId(id);
  };

  const handleSelectBrand = (brand: typeof BRANDS[0]) => {
    setActiveBrand(brand);
  };

  return (
    <div className="relative min-h-screen bg-[#050507] text-zinc-100 flex flex-col justify-between overflow-x-hidden font-sans select-none selection:bg-white/10 selection:text-white" id="sakhaa-forge-app">
      
      {/* Absolute background starry subtle overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.05),rgba(255,255,255,0))] pointer-events-none" />

      {/* Persistent Premium Header */}
      <Header
        brands={BRANDS}
        activeBrand={activeBrand}
        onSelectBrand={handleSelectBrand}
        onRequestAccess={() => setIsAccessModalOpen(true)}
      />

      {/* Main Dynamic Viewport Container */}
      <main className="flex-1 w-full flex flex-col justify-center relative overflow-hidden" id="main-workflow-viewport">
        <AnimatePresence mode="wait">
          {activeStageId === 0 ? (
            /* Stage 0: Main Landing Hero Section */
            <motion.div
              key="hero-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <HeroScene
                activeBrand={activeBrand}
                onRequestAccess={() => setIsAccessModalOpen(true)}
                onExploreWorkflow={() => setActiveStageId(1)}
              />
            </motion.div>
          ) : activeStageId === 1 ? (
            /* Stage 1: The Interactive Problem Breakdown */
            <motion.div
              key="problem-stage"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <ProblemScene
                activeBrand={activeBrand}
                onProceed={() => setActiveStageId(2)}
              />
            </motion.div>
          ) : (
            /* Stages 2 - 11: Side-by-Side Immersive Production Workspace */
            <motion.div
              key="command-center"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-7xl mx-auto px-6 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              {/* Left narrative and detail section */}
              <div className="lg:col-span-5 h-full flex flex-col justify-between">
                <NarrativePanel
                  activeStage={activeStage}
                  activeBrand={activeBrand}
                  onNextStage={handleNextStage}
                  onPrevStage={handlePrevStage}
                  isFirstWorkflowStage={activeStageId === 2}
                  isLastWorkflowStage={activeStageId === PRODUCTION_STAGES.length - 1}
                  onJumpToStage={handleSelectStage}
                />
              </div>

              {/* Right mockup simulation theater console */}
              <div className="lg:col-span-7 h-[480px] lg:h-[500px] flex items-center justify-center">
                <DynamicMockup
                  activeStageId={activeStageId}
                  activeBrand={activeBrand}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Bottom Horizontal Timline Node Progress Rail */}
      <ProgressBar
        stages={PRODUCTION_STAGES}
        activeStageId={activeStageId}
        activeBrand={activeBrand}
        onSelectStage={handleSelectStage}
      />

      {/* Dedicated Interactive Walkthrough Booking / Access Modal Overlay */}
      <AccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        activeBrand={activeBrand}
      />
    </div>
  );
}
