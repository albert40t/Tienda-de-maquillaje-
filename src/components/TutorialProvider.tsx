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
      } else {
        setCoords({
          top: window.innerHeight / 2 - 50,
          left: window.innerWidth / 2 - 150,
          width: 300,
          height: 100
        });
      }
    };

    updatePosition();
    const timer = setTimeout(updatePosition, 300);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [step]);

  const spacing = 15;
  const bubbleWidth = 280;
  
  // Calculate horizontal position to keep bubble within viewport
  const getHorizontalPos = () => {
    let left = coords.left + coords.width / 2 - bubbleWidth / 2;
    // Keep at least 10px from edges
    return Math.max(10, Math.min(window.innerWidth - bubbleWidth - 10, left));
  };

  const bubblePos = step.position === 'bottom' 
    ? { 
        top: Math.min(window.innerHeight - 200, coords.top + coords.height + spacing), 
        left: getHorizontalPos() 
      }
    : step.position === 'top'
    ? { 
        top: Math.max(10, coords.top - 180 - spacing), 
        left: getHorizontalPos() 
      }
    : { 
        top: window.innerHeight / 2 - 80, 
        left: window.innerWidth / 2 - 140 
      };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-all duration-500">
        <svg className="w-full h-full">
          <defs>
            <mask id="hole">
              <rect width="100%" height="100%" fill="white" />
              <rect 
                x={coords.left - 5} 
                y={coords.top - 5} 
                width={coords.width + 10} 
                height={coords.height + 10} 
                rx="8" 
                fill="black" 
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" mask="url(#hole)" fill="currentColor" className="text-black/60" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{ top: bubblePos.top, left: bubblePos.left }}
        className="absolute w-[280px] bg-white rounded-3xl shadow-2xl p-5 pointer-events-auto border border-primary-100"
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1 text-gray-300 hover:text-gray-500 rounded-full"
        >
          <X size={16} />
        </button>

        <div className="flex items-center space-x-2 mb-2 text-primary-600">
          <Info size={16} className="shrink-0" />
          <h4 className="font-bold text-sm leading-tight">{step.title}</h4>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed mb-4">
          {step.content}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {Array.from({ length: totalSteps }).map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all ${
                  idx === stepIndex ? 'w-4 bg-primary-500' : 'w-1 bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={onNext}
            className="flex items-center space-x-1 bg-primary-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-primary-700 shadow-lg shadow-primary-200"
          >
            <span>{isLast ? 'Finalizar' : 'Siguiente'}</span>
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>

        <div 
          className={`absolute left-1/2 -translateX-1/2 w-4 h-4 bg-white rotate-45 border border-primary-100 border-t-0 border-l-0 ${
            step.position === 'bottom' ? '-top-2 border-t border-l border-b-0 border-r-0' : '-bottom-2'
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
