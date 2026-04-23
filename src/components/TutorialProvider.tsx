import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, Info } from 'lucide-react';

interface TutorialStep {
  id: string;
  path: string;
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    path: '/dashboard',
    targetId: 'dashboard-stats',
    title: '¡Bienvenida a Stefy Beauty!',
    content: 'En esta pantalla verás un resumen de tus ventas, ganancias y stock actual de forma gráfica.',
    position: 'bottom'
  },
  {
    id: 'pos-nav',
    path: '/dashboard',
    targetId: 'nav-pos',
    title: 'Realiza Ventas',
    content: 'Toca aquí para entrar a la Caja y procesar pagos de tus clientas.',
    position: 'top'
  },
  {
    id: 'pos-simulation',
    path: '/pos',
    targetId: 'pos-simulate-target',
    title: 'Caja Registradora',
    content: 'En este modo tutorial, nada de lo que hagas se guardará realmente. ¡Prueba sin miedo!',
    position: 'bottom'
  },
  {
    id: 'inventory-nav',
    path: '/pos',
    targetId: 'nav-inventory',
    title: 'Gestiona tu Stock',
    content: 'En la sección de Inventario puedes agregar productos nuevos y controlar existencias.',
    position: 'top'
  },
  {
    id: 'add-category',
    path: '/inventory',
    targetId: 'btn-add-category',
    title: 'Categorías y Productos',
    content: 'Prueba añadir una categoría. Recuerda que en modo tutorial los cambios son simulados.',
    position: 'bottom'
  },
  {
    id: 'customers-nav',
    path: '/inventory',
    targetId: 'nav-customers',
    title: 'Base de Datos de Clientes',
    content: 'Aquí puedes guardar la información de tus clientas y ver cuánto han comprado.',
    position: 'top'
  },
  {
    id: 'settings-nav',
    path: '/customers',
    targetId: 'nav-settings',
    title: 'Configuraciones',
    content: 'Personaliza tu negocio, banners y activa las notificaciones push aquí.',
    position: 'top'
  },
  {
    id: 'branding-nav',
    path: '/settings',
    targetId: 'setting-item-branding',
    title: 'Branding y Tienda',
    content: 'Desde aquí puedes cambiar los banners de la tienda y la apariencia de tu App.',
    position: 'bottom'
  }
];

const TutorialOverlay = ({ step, onNext, onClose, isLast, stepIndex, totalSteps }: { 
  step: TutorialStep; 
  onNext: () => void; 
  onClose: () => void;
  isLast: boolean;
  stepIndex: number;
  totalSteps: number;
}) => {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const element = document.getElementById(step.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
        setIsVisible(true);
      } else {
        // Fallback to center spotlight if target not found yet
        setCoords({
          top: window.innerHeight / 2 - 2,
          left: window.innerWidth / 2 - 2,
          width: 4,
          height: 4
        });
        setIsVisible(false);
      }
    };

    updatePosition();
    // Use an interval for a short time to catch dynamic renders/animations
    const timer = setTimeout(updatePosition, 100);
    const timer2 = setTimeout(updatePosition, 500);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [step]);

  const spacing = 16;
  const bubbleWidth = Math.min(window.innerWidth - 32, 320);
  
  const getHorizontalPos = () => {
    let left = coords.left + coords.width / 2 - bubbleWidth / 2;
    return Math.max(16, Math.min(window.innerWidth - bubbleWidth - 16, left));
  };

  const bubblePos = step.position === 'bottom' 
    ? { 
        top: Math.min(window.innerHeight - 240, coords.top + coords.height + spacing), 
        left: getHorizontalPos() 
      }
    : step.position === 'top'
    ? { 
        top: Math.max(16, coords.top - 220 - spacing), 
        left: getHorizontalPos() 
      }
    : { 
        top: window.innerHeight / 2 - 120, 
        left: window.innerWidth / 2 - bubbleWidth / 2 
      };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden select-none">
      {/* High-End Spotlight Overlay with Smooth transition */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        style={{
          clipPath: isVisible ? `polygon(
            0% 0%, 
            100% 0%, 
            100% 100%, 
            0% 100%, 
            0% 0%, 
            ${coords.left - 4}px 0%, 
            ${coords.left - 4}px ${coords.top - 4}px, 
            ${coords.left + coords.width + 4}px ${coords.top - 4}px, 
            ${coords.left + coords.width + 4}px ${coords.top + coords.height + 4}px, 
            ${coords.left - 4}px ${coords.top + coords.height + 4}px, 
            ${coords.left - 4}px 0%
          )` : 'none'
        }}
      />

      {/* Target Focus Ring */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 1.2, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'absolute',
              top: coords.top - 12,
              left: coords.left - 12,
              width: coords.width + 24,
              height: coords.height + 24,
              borderRadius: '1.25rem',
              boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.4), 0 0 20px rgba(var(--primary-500), 0.5)',
              pointerEvents: 'none'
            }}
            className="ring-4 ring-primary-500/20 backdrop-brightness-125"
          />
        )}
      </AnimatePresence>

      {/* Modern Glassmorphism Bubble */}
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: 15 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        exit={{ opacity: 0, scale: 0.9, rotateX: -15 }}
        transition={{ 
          type: "spring", 
          damping: 22, 
          stiffness: 260,
          mass: 1 
        }}
        style={{ 
          top: bubblePos.top, 
          left: bubblePos.left,
          width: bubbleWidth
        }}
        className="absolute bg-white/95 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] p-7 pointer-events-auto border border-white/40 backdrop-blur-2xl ring-1 ring-black/5"
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-300 hover:text-gray-900 hover:bg-gray-100/50 rounded-full transition-all group"
          title="Cerrar Guía"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform" />
        </button>

        <div className="flex items-center space-x-4 mb-5">
          <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
            <Info size={24} />
          </div>
          <div>
            <h4 className="font-black text-lg text-gray-900 leading-none mb-1">{step.title}</h4>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded-md">
                Paso {stepIndex + 1}
              </span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">de {totalSteps}</span>
            </div>
          </div>
        </div>

        <p className="text-[13px] text-gray-600 font-medium leading-relaxed mb-8">
          {step.content}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === stepIndex 
                    ? 'w-8 bg-primary-600' 
                    : idx < stepIndex 
                    ? 'w-2 bg-primary-200'
                    : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={onNext}
            className="flex items-center space-x-2 bg-gray-900 text-white px-7 py-3.5 rounded-[1.25rem] text-sm font-black hover:bg-primary-600 hover:shadow-2xl hover:shadow-primary-600/30 active:scale-95 transition-all group"
          >
            <span>{isLast ? 'Finalizar Guía' : 'Siguiente'}</span>
            {!isLast && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </div>

        {/* Professional Arrow */}
        <div 
          className={`absolute left-1/2 -translateX-1/2 w-5 h-5 bg-white/95 rotate-45 border-white/20 ring-1 ring-black/5 z-[-1] ${
            step.position === 'bottom' ? '-top-2.5' : '-bottom-2.5'
          }`}
        />
      </motion.div>
    </div>
  );
};

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  startTutorial: () => void;
  stopTutorial: () => void;
  nextStep: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    navigate(tutorialSteps[0].path);
  };

  const stopTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextIdx = currentStep + 1;
      const nextPath = tutorialSteps[nextIdx].path;
      
      setCurrentStep(nextIdx);
      if (location.pathname !== nextPath) {
        navigate(nextPath);
      }
    } else {
      stopTutorial();
    }
  };

  return (
    <TutorialContext.Provider value={{ isActive, currentStep, startTutorial, stopTutorial, nextStep }}>
      {children}
      <AnimatePresence>
        {isActive && (
          <TutorialOverlay 
            step={tutorialSteps[currentStep]} 
            onNext={nextStep} 
            onClose={stopTutorial}
            isLast={currentStep === tutorialSteps.length - 1}
            stepIndex={currentStep}
            totalSteps={tutorialSteps.length}
          />
        )}
      </AnimatePresence>
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) throw new Error('useTutorial must be used within TutorialProvider');
  return context;
};
