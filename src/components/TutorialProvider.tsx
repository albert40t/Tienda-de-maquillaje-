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
    targetId: 'tutorial-welcome',
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
    content: 'Prueba tocar un producto para añadirlo al carrito. ¡Tranquila, nada se guardará!',
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
    content: 'Prueba añadir una categoría nueva aquí arriba. Los cambios son de prueba.',
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
    content: 'Toca aquí para entrar a las configuraciones de la aplicación.',
    position: 'top'
  },
  {
    id: 'banners-nav',
    path: '/settings',
    targetId: 'setting-item-banners',
    title: 'Banners de la Tienda',
    content: 'Desde aquí puedes cambiar las imágenes que tus clientes ven al entrar a tu tienda.',
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
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null;
    let targetElement: HTMLElement | null = null;

    const updatePosition = () => {
      const element = document.getElementById(step.targetId);
      if (element) {
        if (element !== targetElement) {
          if (resizeObserver && targetElement) {
            resizeObserver.unobserve(targetElement);
          }
          targetElement = element;
          if (!resizeObserver) {
            resizeObserver = new ResizeObserver(() => {
              updatePosition();
            });
          }
          resizeObserver.observe(element);
        }

        const rect = element.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    updatePosition();
    const t1 = setTimeout(updatePosition, 100);
    const t2 = setTimeout(updatePosition, 1000);
    const interval = setInterval(updatePosition, 500); // Polling as fallback

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(interval);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [step]);

  const isMobile = window.innerWidth < 768;
  const isTargetAtTop = coords.top < window.innerHeight / 2; // If target is in the top half, move banner to bottom

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none select-none">
      {/* Precision Highlight - Thin & Vibrant */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: coords.top - 2,
              left: coords.left - 2,
              width: coords.width + 4,
              height: coords.height + 4,
              borderRadius: '0.5rem',
              border: '2px solid #EC4899', 
              boxShadow: '0 0 0 2px white, 0 0 10px rgba(236, 72, 153, 0.4)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <motion.div 
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -inset-2 border-2 border-pink-400/30 rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Banner - Intelligent Placement */}
      <div className={`fixed left-0 right-0 z-[10001] pointer-events-none transition-all ${
        isMobile 
          ? (isTargetAtTop ? 'bottom-4 px-4' : 'top-4 px-4') 
          : 'bottom-8 px-8 flex justify-center'
      }`}>
        <motion.div
          key={step.id}
          drag={isMobile}
          dragMomentum={false}
          dragConstraints={{ top: -window.innerHeight + 100, bottom: window.innerHeight - 100, left: 0, right: 0 }}
          initial={isMobile ? { y: isTargetAtTop ? 50 : -50, opacity: 0 } : { y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`bg-white pointer-events-auto shadow-[0_20px_60px_rgba(0,0,0,0.3)] ${
            isMobile 
              ? `w-full rounded-2xl border border-gray-200/50` 
              : 'w-[420px] rounded-3xl border border-gray-200/50 p-6'
          }`}
        >
          <div className={isMobile ? 'px-4 py-3 bg-white/90 backdrop-blur-md flex flex-col' : ''}>
            {isMobile && (
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2 cursor-grab active:cursor-grabbing" />
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Info size={16} />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-xs leading-none mb-1">
                    {step.title} <span className="text-gray-400 font-bold ml-1">({stepIndex + 1}/{totalSteps})</span>
                  </h4>
                  {(!isMinimized || !isMobile) && (
                    <p className="text-[11px] text-gray-600 font-medium leading-tight max-w-[200px] md:max-w-none">
                      {step.content}
                    </p>
                  )}
                  {isMinimized && isMobile && (
                    <button onClick={() => setIsMinimized(false)} className="text-[10px] text-primary-600 font-bold">
                      Ver instrucción...
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {isMobile && (
                  <button 
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1.5 text-gray-400"
                  >
                    <ChevronRight className={isMinimized ? 'rotate-90' : '-rotate-90'} size={16} />
                  </button>
                )}
                
                <button
                  onClick={onNext}
                  className="bg-primary-600 text-white px-4 py-2 rounded-xl text-[10px] font-black shadow-md shadow-primary-200 hover:bg-primary-700 active:scale-95 transition-all"
                >
                  {isLast ? 'Cerrar' : 'Siguiente'}
                </button>
                
                {!isMobile && (
                  <button onClick={onClose} className="p-1.5 text-gray-300 hover:text-gray-600">
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Progress Bar (Only Desktop) */}
            {!isMobile && (
              <div className="mt-4 flex space-x-1">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === stepIndex ? 'w-8 bg-primary-600' : 'w-2 bg-gray-100'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
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
