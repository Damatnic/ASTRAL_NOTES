import React, { useState, useEffect } from 'react';
import { pwaService, PWACapabilities } from '../../services/pwaService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface PWAInstallBannerProps {
  className?: string;
  autoShow?: boolean;
}

export function PWAInstallBanner({ className, autoShow = true }: PWAInstallBannerProps) {
  const [capabilities, setCapabilities] = useState<PWACapabilities | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const updateCapabilities = (caps: PWACapabilities) => {
      setCapabilities(caps);
      
      // Show banner if app can be installed and not dismissed
      if (autoShow && caps.canInstall && !caps.isInstalled && !dismissed) {
        setShowBanner(true);
      }
    };

    const handleInstallAvailable = () => {
      if (autoShow && !dismissed) {
        setShowBanner(true);
      }
    };

    const handleInstalled = () => {
      setShowBanner(false);
      setShowModal(false);
      setInstalling(false);
    };

    const handleIOSInstructions = () => {
      setShowIOSInstructions(true);
    };

    pwaService.on('initialized', updateCapabilities);
    pwaService.on('installAvailable', handleInstallAvailable);
    pwaService.on('installed', handleInstalled);
    pwaService.on('iosInstallInstructions', handleIOSInstructions);

    // Get initial capabilities
    setCapabilities(pwaService.getCapabilities());

    return () => {
      pwaService.off('initialized', updateCapabilities);
      pwaService.off('installAvailable', handleInstallAvailable);
      pwaService.off('installed', handleInstalled);
      pwaService.off('iosInstallInstructions', handleIOSInstructions);
    };
  }, [autoShow, dismissed]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const success = await pwaService.install();
      if (success) {
        setShowBanner(false);
        setShowModal(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleLearnMore = () => {
    setShowModal(true);
  };

  // Check if previously dismissed (within last 7 days)
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
      }
    }
  }, []);

  if (!capabilities || capabilities.isInstalled || !showBanner) {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      <div className={`pwa-install-banner ${className}`}>
        <div className="pwa-banner-content">
          <div className="pwa-banner-icon">📱</div>
          <div className="pwa-banner-text">
            <h4>Install ASTRAL_NOTES</h4>
            <p>Get the full app experience with offline writing and faster performance</p>
          </div>
          <div className="pwa-banner-actions">
            <Button
              onClick={handleInstall}
              disabled={installing}
              className="pwa-install-btn"
            >
              {installing ? 'Installing...' : 'Install'}
            </Button>
            <Button
              onClick={handleLearnMore}
              variant="ghost"
              className="pwa-learn-more-btn"
            >
              Learn More
            </Button>
            <button
              onClick={handleDismiss}
              className="pwa-dismiss-btn"
              aria-label="Dismiss install banner"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Installation Info Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Install ASTRAL_NOTES"
        className="max-w-2xl"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Get the Best Writing Experience
            </h3>
            <p className="text-gray-600">
              Install ASTRAL_NOTES as a Progressive Web App for enhanced features and performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">⚡</span>
                <h4 className="font-medium text-blue-900">Faster Performance</h4>
              </div>
              <p className="text-sm text-blue-800">
                Native-like performance with instant loading and smooth interactions
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">📴</span>
                <h4 className="font-medium text-green-900">Offline Writing</h4>
              </div>
              <p className="text-sm text-green-800">
                Continue writing even without internet connection
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🏠</span>
                <h4 className="font-medium text-purple-900">Home Screen Access</h4>
              </div>
              <p className="text-sm text-purple-800">
                Quick access from your device's home screen
              </p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🔔</span>
                <h4 className="font-medium text-orange-900">Push Notifications</h4>
              </div>
              <p className="text-sm text-orange-800">
                Get notified about writing goals and reminders
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">What happens when you install?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• ASTRAL_NOTES appears on your home screen</li>
              <li>• Works offline with automatic sync when online</li>
              <li>• Faster loading and better performance</li>
              <li>• Native-like experience without browser UI</li>
              <li>• All your data remains secure and private</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowModal(false)}
              variant="outline"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleInstall}
              disabled={installing}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            >
              {installing ? 'Installing...' : 'Install Now'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* iOS Installation Instructions */}
      <Modal
        isOpen={showIOSInstructions}
        onClose={() => setShowIOSInstructions(false)}
        title="Install on iOS"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl mb-3">🍎</div>
            <p className="text-gray-600">
              To install ASTRAL_NOTES on your iPhone or iPad:
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</span>
              <div>
                <p className="text-sm">
                  Tap the <strong>Share</strong> button in Safari
                  <span className="ml-2 text-lg">📤</span>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</span>
              <div>
                <p className="text-sm">
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                  <span className="ml-2 text-lg">➕</span>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</span>
              <div>
                <p className="text-sm">
                  Tap <strong>"Add"</strong> to install the app
                  <span className="ml-2 text-lg">✅</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> This only works in Safari browser on iOS devices.
            </p>
          </div>
        </div>
      </Modal>

      <style jsx>{`
        .pwa-install-banner {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          backdrop-filter: blur(10px);
          max-width: 600px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .pwa-install-banner {
            left: auto;
            right: 20px;
            max-width: 400px;
            margin: 0;
          }
        }

        .pwa-banner-content {
          display: flex;
          align-items: center;
          padding: 16px;
          gap: 12px;
        }

        .pwa-banner-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .pwa-banner-text {
          flex: 1;
          min-width: 0;
        }

        .pwa-banner-text h4 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .pwa-banner-text p {
          margin: 0;
          font-size: 0.875rem;
          opacity: 0.9;
          line-height: 1.4;
        }

        .pwa-banner-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .pwa-install-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pwa-install-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .pwa-learn-more-btn {
          color: white;
          font-size: 0.875rem;
          padding: 8px 12px;
        }

        .pwa-dismiss-btn {
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          opacity: 0.7;
          padding: 4px;
          border-radius: 4px;
          transition: opacity 0.2s ease;
        }

        .pwa-dismiss-btn:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 480px) {
          .pwa-banner-content {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }

          .pwa-banner-actions {
            width: 100%;
            justify-content: center;
          }

          .pwa-dismiss-btn {
            position: absolute;
            top: 8px;
            right: 8px;
          }
        }
      `}</style>
    </>
  );
}

export default PWAInstallBanner;