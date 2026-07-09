import React, { useState, useEffect } from 'react'
import { Sprout, Brush, Dna, Zap, Target } from 'lucide-react'
import './OnboardingModal.css'
import { useUIStore } from '../store/useUIStore';

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: "Welcome to Darwin's Canvas!",
    description: "Let's learn how to build your first ecosystem.",
    icon: <Sprout size={40} color="white" />,
    color: "var(--color-tertiary)" // Greenish
  },
  {
    id: 'draw',
    title: "Drawing Life",
    description: "Use the big + button at the bottom to draw your first creature. Big ones are tanks, small ones are speedy.",
    icon: <Brush size={40} color="white" />,
    color: "var(--color-primary)" // Orange/Red
  },
  {
    id: 'evolution',
    title: "Evolution",
    description: "Creatures hunt, eat, and mutate on their own. Watch them grow into glowing Level 5 Bosses!",
    icon: <Dna size={40} color="white" />,
    color: "var(--color-secondary)" // Blue
  },
  {
    id: 'godtools',
    title: "Play God",
    description: "Use God Tools to zap, feed, or drag creatures around. (Tip: Use WASD or Arrow Keys to pan the camera!)",
    icon: <Zap size={40} color="white" />,
    color: "#FBC02D" // Yellow/Gold
  },
  {
    id: 'tracking',
    title: "Track Champions!",
    description: "Click the crosshair button on any creature to pin their health bar to your screen. Keep a close eye on your favorites!",
    icon: <Target size={40} color="white" />,
    color: "#e74c3c" // Red
  }
]

export function OnboardingModal() {
  const isOpen = useUIStore((s) => s.isOnboardingOpen)
  const close = useUIStore((s) => s.closeOnboarding)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const step = ONBOARDING_STEPS[currentStep]
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  const handleNext = () => {
    if (isLastStep) {
      close()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  // Use key={step.id} to force React to re-mount the content and trigger animations
  return (
    <div className="onboarding-backdrop">
      <div className="onboarding-modal">
        <div className="onboarding-content" key={step.id}>
          <div 
            className="onboarding-icon-container" 
            style={{ backgroundColor: step.color, borderColor: 'var(--color-text)' }}
          >
            {step.icon}
          </div>
          <h2 className="onboarding-title">{step.title}</h2>
          <p className="onboarding-description">{step.description}</p>
        </div>

        <div className="onboarding-footer">
          <div className="onboarding-dots">
            {ONBOARDING_STEPS.map((_, index) => (
              <div 
                key={index} 
                className={`onboarding-dot ${index === currentStep ? 'active' : ''}`} 
              />
            ))}
          </div>

          <div className="onboarding-actions">
            {!isLastStep && (
              <button className="btn-skip" onClick={close}>
                Skip
              </button>
            )}
            <button 
              className={`btn-next ${isLastStep ? 'btn-start' : ''}`}
              onClick={handleNext}
            >
              {isLastStep ? "Let's Go!" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
