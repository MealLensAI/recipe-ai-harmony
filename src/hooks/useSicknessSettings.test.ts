// Simple test to verify sickness settings functionality
// This is a basic test to ensure the hook works as expected

import { renderHook, act } from '@testing-library/react';
import { useSicknessSettings } from './useSicknessSettings';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('useSicknessSettings', () => {
    beforeEach(() => {
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
    });

    it('should initialize with default values', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const { result } = renderHook(() => useSicknessSettings());

        expect(result.current.settings).toEqual({
            hasSickness: false,
            sicknessType: ''
        });
    });

    it('should load saved settings from localStorage', () => {
        const savedSettings = {
            hasSickness: true,
            sicknessType: 'diabetes'
        };
        localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));

        const { result } = renderHook(() => useSicknessSettings());

        expect(result.current.settings).toEqual(savedSettings);
    });

    it('should update settings correctly', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const { result } = renderHook(() => useSicknessSettings());

        act(() => {
            result.current.updateSettings({
                hasSickness: true,
                sicknessType: 'hypertension'
            });
        });

        expect(result.current.settings).toEqual({
            hasSickness: true,
            sicknessType: 'hypertension'
        });
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'sicknessSettings',
            JSON.stringify({
                hasSickness: true,
                sicknessType: 'hypertension'
            })
        );
    });

    it('should return sickness info when user has sickness', () => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify({
            hasSickness: true,
            sicknessType: 'diabetes'
        }));

        const { result } = renderHook(() => useSicknessSettings());

        expect(result.current.getSicknessInfo()).toEqual({
            hasSickness: true,
            sicknessType: 'diabetes'
        });
    });

    it('should return null when user has no sickness', () => {
        localStorageMock.getItem.mockReturnValue(JSON.stringify({
            hasSickness: false,
            sicknessType: ''
        }));

        const { result } = renderHook(() => useSicknessSettings());

        expect(result.current.getSicknessInfo()).toBeNull();
    });
}); 