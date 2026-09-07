import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './useUIStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      activeTool: 'POINTER',
      selectedCreatureId: null,
      cameraMode: 'FREE',
      targetZoom: 1.0,
      keys: { up: false, down: false, left: false, right: false },
      panSpeed: 1200,
      isPanelOpen: false,
      isTutorialOpen: false,
      isOnboardingOpen: false,
      isStatsOpen: false,
      isPauseMenuOpen: false,
      confirmDialog: null,
    });
  });

  it('setActiveTool updates tool', () => {
    useUIStore.getState().setActiveTool('SMITE');
    expect(useUIStore.getState().activeTool).toBe('SMITE');
  });

  it('setSelectedCreatureId updates id', () => {
    useUIStore.getState().setSelectedCreatureId('creature-123');
    expect(useUIStore.getState().selectedCreatureId).toBe('creature-123');
  });

  it('setCameraMode updates mode', () => {
    useUIStore.getState().setCameraMode('TRACKING');
    expect(useUIStore.getState().cameraMode).toBe('TRACKING');
  });

  it('setTargetZoom updates zoom', () => {
    useUIStore.getState().setTargetZoom(2.0);
    expect(useUIStore.getState().targetZoom).toBe(2.0);
  });

  it('setKeys merges keys', () => {
    useUIStore.getState().setKeys({ up: true });
    expect(useUIStore.getState().keys).toEqual({ up: true, down: false, left: false, right: false });
    
    useUIStore.getState().setKeys({ left: true, right: true });
    expect(useUIStore.getState().keys).toEqual({ up: true, down: false, left: true, right: true });
  });

  it('panel open/close functions', () => {
    useUIStore.getState().openPanel();
    expect(useUIStore.getState().isPanelOpen).toBe(true);
    useUIStore.getState().closePanel();
    expect(useUIStore.getState().isPanelOpen).toBe(false);
  });

  it('tutorial open/close functions', () => {
    useUIStore.getState().openTutorial();
    expect(useUIStore.getState().isTutorialOpen).toBe(true);
    useUIStore.getState().closeTutorial();
    expect(useUIStore.getState().isTutorialOpen).toBe(false);
  });

  it('onboarding open/close functions', () => {
    useUIStore.getState().openOnboarding();
    expect(useUIStore.getState().isOnboardingOpen).toBe(true);
    useUIStore.getState().closeOnboarding();
    expect(useUIStore.getState().isOnboardingOpen).toBe(false);
  });

  it('stats open/close functions', () => {
    useUIStore.getState().openStats();
    expect(useUIStore.getState().isStatsOpen).toBe(true);
    useUIStore.getState().closeStats();
    expect(useUIStore.getState().isStatsOpen).toBe(false);
  });

  it('pause menu open/close functions', () => {
    useUIStore.getState().openPauseMenu();
    expect(useUIStore.getState().isPauseMenuOpen).toBe(true);
    useUIStore.getState().closePauseMenu();
    expect(useUIStore.getState().isPauseMenuOpen).toBe(false);
  });

  it('confirm dialog request and close', () => {
    const onConfirm = () => {};
    const onCancel = () => {};
    useUIStore.getState().requestConfirm('Are you sure?', onConfirm, onCancel);
    expect(useUIStore.getState().confirmDialog).toEqual({ message: 'Are you sure?', onConfirm, onCancel });
    
    useUIStore.getState().closeConfirm();
    expect(useUIStore.getState().confirmDialog).toBeNull();
  });
});
