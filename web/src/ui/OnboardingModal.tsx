import React, { useState, useEffect } from 'react'
import { Sprout, Brush, Dna, Zap } from 'lucide-react'
import { useStore } from '../store/useStore'
import './OnboardingModal.css'

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
  }
]

export function OnboardingModal() {
  const isOpen = useStore((s) => s.isOnboardingOpen)
  const close = useStore((s) => s.closeOnboarding)
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
