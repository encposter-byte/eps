import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

// Типы для события установки (не входят в стандартные типы)
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Интервал между показами предложения установки (1 день)
const PROMPT_INTERVAL_MS = 24 * 60 * 60 * 1000; 

export default function InstallAppPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // Проверяем, можно ли показать приглашение
    const canShowPrompt = () => {
      const lastPromptTime = localStorage.getItem('lastAppInstallPromptTime');
      if (!lastPromptTime) return true;
      
      const timeSinceLastPrompt = Date.now() - parseInt(lastPromptTime, 10);
      return timeSinceLastPrompt > PROMPT_INTERVAL_MS;
    };
    
    // Обработчик события beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Показываем предложение только если прошло достаточно времени с последнего показа
      if (canShowPrompt()) {
        setShowPrompt(true);
        localStorage.setItem('lastAppInstallPromptTime', Date.now().toString());
      }
    };
    
    // Дополнительные проверки для iOS, где нет события beforeinstallprompt
    const checkIOSInstallPrompt = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      
      if (isIOS && !isInStandaloneMode && canShowPrompt()) {
        setShowPrompt(true);
        localStorage.setItem('lastAppInstallPromptTime', Date.now().toString());
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Для iOS устройств проверяем возможность показа приглашения после загрузки
    if (isMobile) {
      setTimeout(checkIOSInstallPrompt, 3000);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isMobile]);
  
  // Функция установки приложения
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Для iOS показываем инструкции
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        alert('Чтобы установить приложение, нажмите на кнопку "Поделиться" в браузере, а затем выберите "На экран Домой"');
      }
      return;
    }
    
    // Показываем браузерное приглашение
    await deferredPrompt.prompt();
    
    // Ожидаем ответа пользователя
    const choiceResult = await deferredPrompt.userChoice;
    // Результат выбора пользователя: choiceResult.outcome
    
    // Сбрасываем сохраненное событие
    setDeferredPrompt(null);
    setShowPrompt(false);
  };
  
  // Закрыть предложение и не показывать в течение интервала
  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('lastAppInstallPromptTime', Date.now().toString());
  };
  
  if (!showPrompt || !isMobile) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white p-4 shadow-lg border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-eps-red p-2 rounded-full text-white">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Установите приложение ЭПС</h3>
            <p className="text-sm text-gray-600">Быстрый доступ к каталогу инструментов</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={dismissPrompt}
            className="border-gray-300 text-gray-500"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleInstallClick}
            className="bg-eps-red hover:bg-red-700 text-white"
          >
            <Download className="h-4 w-4 mr-1" />
            Установить
          </Button>
        </div>
      </div>
    </div>
  );
}